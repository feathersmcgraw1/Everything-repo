import type { ModelType, ColormapName, InitialCondition, ToolType } from '../types';
import { getColormapPreviewData } from './colormaps';

// CPU-based fallback engine for browsers without WebGL2 support
// Runs the simulation on the CPU and renders via Canvas2D

type ColormapLUT = Uint8Array; // 256 * 4 (RGBA)

function buildFullColormapLUT(name: ColormapName): ColormapLUT {
  const small = getColormapPreviewData(name); // 64 * 4
  const lut = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = (i / 255) * 63;
    const lo = Math.floor(t);
    const hi = Math.min(lo + 1, 63);
    const frac = t - lo;
    for (let c = 0; c < 4; c++) {
      lut[i * 4 + c] = Math.round(small[lo * 4 + c] * (1 - frac) + small[hi * 4 + c] * frac);
    }
  }
  return lut;
}

export class CPUSimulationEngine {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private width = 256; // Smaller grid for CPU perf
  private height = 256;

  // Double buffer: U and V channels
  private u!: Float32Array;
  private v!: Float32Array;
  private uNext!: Float32Array;
  private vNext!: Float32Array;

  // Wall mask
  private walls!: Uint8Array;

  // Rendering
  private imageData!: ImageData;
  private colormapLUT!: ColormapLUT;
  private currentColormap: ColormapName = 'viridis';

  // State
  private currentModel: ModelType = 'gray-scott';
  private params: Record<string, number> = {};
  private running = false;
  private animFrameId = 0;
  private stepsPerFrame = 5; // Fewer steps for CPU

  // Undo
  private undoStack: { u: Float32Array; v: Float32Array }[] = [];
  private maxUndoSteps = 10;

  // Activity tracking
  private lastAvgV = 0;
  onActivityUpdate?: (level: number) => void;

  init(canvas: HTMLCanvasElement, gridSize = 256) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = Math.min(gridSize, 256); // Cap at 256 for CPU
    this.height = this.width;

    const n = this.width * this.height;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.uNext = new Float32Array(n);
    this.vNext = new Float32Array(n);
    this.walls = new Uint8Array(n);
    this.imageData = new ImageData(this.width, this.height);
    this.colormapLUT = buildFullColormapLUT(this.currentColormap);

    this.resetState('center');
  }

  wallMask = {
    paint: (x: number, y: number, radius: number, value: boolean, square: boolean) => {
      const r = Math.ceil(radius);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const px = Math.round(x) + dx;
          const py = Math.round(y) + dy;
          if (px < 0 || px >= this.width || py < 0 || py >= this.height) continue;
          const dist = square ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            this.walls[py * this.width + px] = value ? 1 : 0;
          }
        }
      }
    },
    clear: () => { this.walls?.fill(0); },
    hasWalls: () => this.walls?.some(v => v > 0) ?? false,
    texture: null,
  };

  private simulateStep() {
    const w = this.width;
    const h = this.height;
    const u = this.u;
    const v = this.v;
    const un = this.uNext;
    const vn = this.vNext;
    const walls = this.walls;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (walls[i]) {
          un[i] = u[i];
          vn[i] = v[i];
          continue;
        }

        // 5-point Laplacian with wrapping
        const left = y * w + ((x - 1 + w) % w);
        const right = y * w + ((x + 1) % w);
        const up = ((y - 1 + h) % h) * w + x;
        const down = ((y + 1) % h) * w + x;

        const lapU = u[left] + u[right] + u[up] + u[down] - 4 * u[i];
        const lapV = v[left] + v[right] + v[up] + v[down] - 4 * v[i];

        const ui = u[i];
        const vi = v[i];

        let du: number, dv: number;

        if (this.currentModel === 'gray-scott') {
          const F = this.params.F ?? 0.037;
          const k = this.params.k ?? 0.06;
          const Du = this.params.Du ?? 0.21;
          const Dv = this.params.Dv ?? 0.105;
          const uvv = ui * vi * vi;
          du = Du * lapU - uvv + F * (1 - ui);
          dv = Dv * lapV + uvv - (F + k) * vi;
        } else if (this.currentModel === 'fitzhugh-nagumo') {
          const a = this.params.a ?? 0.5;
          const b = this.params.b ?? 0.8;
          const eps = this.params.epsilon ?? 0.01;
          const Du = this.params.Du ?? 0.2;
          const Dv = this.params.Dv ?? 0.0;
          du = ui - (ui * ui * ui) / 3 - vi + Du * lapU;
          dv = eps * (ui + a - b * vi) + Dv * lapV;
        } else if (this.currentModel === 'schnakenberg') {
          const a = this.params.a ?? 0.1;
          const b = this.params.b ?? 0.9;
          const Du = this.params.Du ?? 0.5;
          const Dv = this.params.Dv ?? 0.1;
          const u2v = ui * ui * vi;
          du = a - ui + u2v + Du * lapU;
          dv = b - u2v + Dv * lapV;
        } else {
          // Brusselator
          const a = this.params.a ?? 1.0;
          const b = this.params.b ?? 3.0;
          const Du = this.params.Du ?? 0.5;
          const Dv = this.params.Dv ?? 0.1;
          const u2v = ui * ui * vi;
          du = a - (b + 1) * ui + u2v + Du * lapU;
          dv = b * ui - u2v + Dv * lapV;
        }

        const dt = this.params.dt ?? 1.0;
        un[i] = ui + du * dt;
        vn[i] = vi + dv * dt;

        // Clamp for Gray-Scott (others may go negative)
        if (this.currentModel === 'gray-scott') {
          un[i] = Math.max(0, Math.min(1, un[i]));
          vn[i] = Math.max(0, Math.min(1, vn[i]));
        }
      }
    }

    // Swap
    const tmpU = this.u;
    const tmpV = this.v;
    this.u = this.uNext;
    this.v = this.vNext;
    this.uNext = tmpU;
    this.vNext = tmpV;
  }

  private renderToScreen() {
    const data = this.imageData.data;
    const lut = this.colormapLUT;
    const v = this.v;
    const n = this.width * this.height;

    for (let i = 0; i < n; i++) {
      const val = Math.max(0, Math.min(1, v[i]));
      const lutIdx = Math.round(val * 255) * 4;
      data[i * 4] = lut[lutIdx];
      data[i * 4 + 1] = lut[lutIdx + 1];
      data[i * 4 + 2] = lut[lutIdx + 2];
      data[i * 4 + 3] = 255;
    }

    // Draw scaled to canvas size
    const tmpCanvas = new OffscreenCanvas(this.width, this.height);
    const tmpCtx = tmpCanvas.getContext('2d')!;
    tmpCtx.putImageData(this.imageData, 0, 0);

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(tmpCanvas, 0, 0, this.canvas.width, this.canvas.height);
  }

  private frameCount = 0;

  private frame = () => {
    if (!this.running) return;

    for (let i = 0; i < this.stepsPerFrame; i++) {
      this.simulateStep();
    }

    this.renderToScreen();

    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      let sum = 0;
      for (let i = 0; i < this.v.length; i++) sum += this.v[i];
      const avg = sum / this.v.length;
      const activity = Math.abs(avg - this.lastAvgV) * 10;
      this.lastAvgV = avg;
      this.onActivityUpdate?.(Math.min(1, activity));
    }

    this.animFrameId = requestAnimationFrame(this.frame);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.animFrameId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  isRunning() { return this.running; }

  setModel(model: ModelType) {
    this.currentModel = model;
  }

  setParams(params: Record<string, number>) {
    this.params = { ...params };
  }

  setStepsPerFrame(steps: number) {
    this.stepsPerFrame = Math.max(1, Math.min(10, steps));
  }

  setColormap(name: ColormapName) {
    this.currentColormap = name;
    this.colormapLUT = buildFullColormapLUT(name);
    if (!this.running) this.renderToScreen();
  }

  resetState(condition: InitialCondition, text?: string) {
    const w = this.width;
    const h = this.height;

    this.u.fill(1);
    this.v.fill(0);

    switch (condition) {
      case 'center': {
        const cx = w / 2;
        const cy = h / 2;
        const r = w * 0.04;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy < r * r) {
              this.u[y * w + x] = 0.5;
              this.v[y * w + x] = 0.25;
            }
          }
        }
        break;
      }
      case 'noise': {
        for (let i = 0; i < w * h; i++) {
          this.u[i] = 1.0 - Math.random() * 0.1;
          this.v[i] = Math.random() * 0.1;
        }
        break;
      }
      case 'symmetric': {
        const cx2 = w / 2;
        const cy2 = h / 2;
        const seedR = w * 0.02;
        const dist = w * 0.1;
        for (let s = 0; s < 8; s++) {
          const angle = (s / 8) * Math.PI * 2;
          const sx = cx2 + Math.cos(angle) * dist;
          const sy = cy2 + Math.sin(angle) * dist;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const dx = x - sx;
              const dy = y - sy;
              if (dx * dx + dy * dy < seedR * seedR) {
                this.u[y * w + x] = 0.5;
                this.v[y * w + x] = 0.25;
              }
            }
          }
        }
        break;
      }
      case 'text': {
        if (text) {
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = w;
          tmpCanvas.height = h;
          const ctx = tmpCanvas.getContext('2d')!;
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'white';
          ctx.font = `bold ${h / 4}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, w / 2, h / 2);
          const imgData = ctx.getImageData(0, 0, w, h);
          for (let i = 0; i < w * h; i++) {
            if (imgData.data[i * 4] > 128) {
              this.u[i] = 0.5;
              this.v[i] = 0.25;
            }
          }
        }
        break;
      }
      default:
        break;
    }

    this.walls.fill(0);
    if (!this.running) this.renderToScreen();
  }

  applyBrush(normX: number, normY: number, tool: ToolType, radius: number, intensity: number, square: boolean) {
    if (tool === 'wall' || tool === 'wall-eraser') {
      this.wallMask.paint(normX * this.width, normY * this.height, radius * (this.width / 512), tool === 'wall', square);
      return;
    }

    const cx = normX * this.width;
    const cy = normY * this.height;
    const r = radius * (this.width / 512);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = square ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.sqrt(dx * dx + dy * dy);
        if (dist > r) continue;

        const falloff = 1 - dist / r;
        const strength = falloff * intensity;
        const i = y * this.width + x;

        if (tool === 'inject') {
          this.v[i] = Math.min(1, this.v[i] + strength);
        } else if (tool === 'erase') {
          this.u[i] = this.u[i] + (1.0 - this.u[i]) * strength;
          this.v[i] = this.v[i] * (1 - strength);
        } else if (tool === 'attractor') {
          this.v[i] = Math.min(1, this.v[i] + strength * 0.5);
        } else if (tool === 'repeller') {
          this.v[i] = Math.max(0, this.v[i] - strength * 0.5);
        }
      }
    }

    if (!this.running) this.renderToScreen();
  }

  pushUndoState() {
    this.undoStack.push({ u: new Float32Array(this.u), v: new Float32Array(this.v) });
    if (this.undoStack.length > this.maxUndoSteps) this.undoStack.shift();
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const state = this.undoStack.pop()!;
    this.u.set(state.u);
    this.v.set(state.v);
    if (!this.running) this.renderToScreen();
    return true;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    if (!this.running) this.renderToScreen();
  }

  setGridSize(size: number) {
    const wasRunning = this.running;
    if (wasRunning) this.stop();
    this.width = Math.min(size, 256);
    this.height = this.width;
    const n = this.width * this.height;
    this.u = new Float32Array(n);
    this.v = new Float32Array(n);
    this.uNext = new Float32Array(n);
    this.vNext = new Float32Array(n);
    this.walls = new Uint8Array(n);
    this.imageData = new ImageData(this.width, this.height);
    this.resetState('center');
    if (wasRunning) this.start();
  }

  getGridSize() { return this.width; }

  setView() {} // No-op for CPU engine

  screenToUV(screenX: number, screenY: number): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const x = (screenX - rect.left) / rect.width;
    const y = 1.0 - (screenY - rect.top) / rect.height;
    return [x, y];
  }

  readVChannel(targetSize = 64): Float32Array {
    const result = new Float32Array(targetSize * targetSize);
    const scale = this.width / targetSize;
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.floor(x * scale);
        const srcY = Math.floor(y * scale);
        result[y * targetSize + x] = this.v[srcY * this.width + srcX];
      }
    }
    return result;
  }

  captureFrame(): Promise<Blob> {
    this.renderToScreen();
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }

  screenshot(): Promise<void> {
    return this.captureFrame().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphogen-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  getCanvas(): HTMLCanvasElement { return this.canvas; }

  destroy() {
    this.stop();
  }
}
