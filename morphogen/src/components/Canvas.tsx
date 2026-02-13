import { useRef, useEffect, useCallback, useState } from 'react';
import { SimulationEngine } from '../gl/engine';
import { CPUSimulationEngine } from '../gl/cpu-engine';
import { useSimulation } from '../store/simulation';

// Engine interface (both GPU and CPU engines share these methods)
type Engine = SimulationEngine | CPUSimulationEngine;

// Singleton engine
let engine: Engine | null = null;
let engineCanvas: HTMLCanvasElement | null = null;

export function getEngine(): Engine | null {
  return engine;
}

function supportsWebGL2(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2');
    if (!gl) return false;
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) return false;
    // Clean up
    const loseExt = gl.getExtension('WEBGL_lose_context');
    loseExt?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [cpuMode, setCpuMode] = useState(false);

  const {
    model, params, running, stepsPerFrame, gridSize, colormap,
    activeTool, brushRadius, brushIntensity,
    setActivityLevel,
  } = useSimulation();

  const currentParams = params[model];

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      engine?.resize(canvas.width, canvas.height);
    };

    if (!engine || engineCanvas !== canvas) {
      if (engine) engine.destroy();

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (supportsWebGL2()) {
        try {
          const gpuEngine = new SimulationEngine();
          gpuEngine.init(canvas, gridSize);
          gpuEngine.onActivityUpdate = (level) => setActivityLevel(level);
          engine = gpuEngine;
          engineCanvas = canvas;

          console.log('Morphogen: Using WebGL2 engine');
        } catch (e) {
          console.warn('WebGL2 init failed, falling back to CPU:', e);
          const cpuEngine = new CPUSimulationEngine();
          cpuEngine.init(canvas, gridSize);
          cpuEngine.onActivityUpdate = (level) => setActivityLevel(level);
          engine = cpuEngine;
          engineCanvas = canvas;

          setCpuMode(true);
        }
      } else {
        console.log('Morphogen: WebGL2 not available, using CPU engine');
        const cpuEngine = new CPUSimulationEngine();
        cpuEngine.init(canvas, gridSize);
        cpuEngine.onActivityUpdate = (level) => setActivityLevel(level);
        engine = cpuEngine;
        engineCanvas = canvas;
        setCpuMode(true);
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [gridSize, setActivityLevel]);

  // Sync model
  useEffect(() => { engine?.setModel(model); }, [model]);

  // Sync params
  useEffect(() => { engine?.setParams(currentParams); }, [currentParams]);

  // Sync running state
  useEffect(() => {
    if (!engine) return;
    if (running) engine.start();
    else engine.stop();
  }, [running]);

  // Sync steps per frame
  useEffect(() => { engine?.setStepsPerFrame(stepsPerFrame); }, [stepsPerFrame]);

  // Sync colormap
  useEffect(() => { engine?.setColormap(colormap); }, [colormap]);

  // Mouse handlers
  const handleBrush = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!engine) return;
    const [uvX, uvY] = engine.screenToUV(e.clientX, e.clientY);
    engine.applyBrush(uvX, uvY, activeTool, brushRadius, brushIntensity, e.shiftKey);
  }, [activeTool, brushRadius, brushIntensity]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    if (e.button === 0) {
      isDragging.current = true;
      engine?.pushUndoState();
      handleBrush(e);
    }
  }, [handleBrush]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) handleBrush(e);
    if (isPanning.current) lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [handleBrush]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) {
      const delta = e.deltaY > 0 ? -2 : 2;
      const s = useSimulation.getState();
      s.setBrushRadius(s.brushRadius + delta);
    }
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {cpuMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full text-[10px] font-mono"
          style={{ background: 'rgba(255,171,0,0.15)', color: '#ffab00', border: '1px solid rgba(255,171,0,0.2)' }}>
          CPU mode (256x256) — Open in Chrome/Firefox for full WebGL2 performance
        </div>
      )}
    </>
  );
}
