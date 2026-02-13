import { useRef, useEffect, useCallback, useState } from 'react';
import { useSimulation, MODEL_CONFIGS } from '../store/simulation';

const MAP_SIZE = 12;
const CELL_SIZE = 16;
const GRID_PX = MAP_SIZE * CELL_SIZE;

// Gray-Scott regime labels (approximate positions)
const GS_LABELS = [
  { label: 'decay', x: 0.15, y: 0.3 },
  { label: 'spots', x: 0.4, y: 0.5 },
  { label: 'stripes', x: 0.45, y: 0.45 },
  { label: 'mitosis', x: 0.35, y: 0.55 },
  { label: 'coral', x: 0.65, y: 0.5 },
  { label: 'worms', x: 0.6, y: 0.6 },
];

export default function ParameterMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { model, params, panels, setParam } = useSimulation();

  if (!panels.paramMap) return null;

  const config = MODEL_CONFIGS[model];
  const [axisX, axisY] = config.primaryAxes;
  const paramDefs = config.paramDefs;
  const xDef = paramDefs.find((d) => d.key === axisX)!;
  const yDef = paramDefs.find((d) => d.key === axisY)!;
  const currentParams = params[model];

  const xNorm = (currentParams[axisX] - xDef.min) / (xDef.max - xDef.min);
  const yNorm = (currentParams[axisY] - yDef.min) / (yDef.max - yDef.min);

  // Draw the map grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || collapsed) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, GRID_PX, GRID_PX);

    // Draw grid cells with gradient colors to represent parameter space
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const nx = x / (MAP_SIZE - 1);
        const ny = y / (MAP_SIZE - 1);

        // Color based on parameter position (hue varies across space)
        const hue = (nx * 180 + ny * 60) % 360;
        const sat = 40 + nx * 30;
        const light = 15 + ny * 15;
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        ctx.fillRect(x * CELL_SIZE, (MAP_SIZE - 1 - y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= MAP_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_PX);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_PX, i * CELL_SIZE);
      ctx.stroke();
    }

    // Regime labels for Gray-Scott
    if (model === 'gray-scott') {
      ctx.font = '8px JetBrains Mono';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'center';
      for (const lbl of GS_LABELS) {
        ctx.fillText(lbl.label, lbl.x * GRID_PX, (1 - lbl.y) * GRID_PX);
      }
    }

    // Crosshair
    const cx = xNorm * GRID_PX;
    const cy = (1 - yNorm) * GRID_PX;

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, GRID_PX);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(GRID_PX, cy);
    ctx.stroke();

    // Dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.strokeStyle = '#0a0e14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [model, currentParams, xNorm, yNorm, collapsed]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;

    const newX = xDef.min + x * (xDef.max - xDef.min);
    const newY = yDef.min + y * (yDef.max - yDef.min);
    setParam(axisX, Math.round(newX / xDef.step) * xDef.step);
    setParam(axisY, Math.round(newY / yDef.step) * yDef.step);
  }, [axisX, axisY, xDef, yDef, setParam]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="glass absolute top-16 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center"
        title="Expand parameter map"
      >
        <div className="w-3 h-3 rounded-full bg-cyan animate-pulse" />
      </button>
    );
  }

  return (
    <div className="glass absolute top-16 right-3 z-20 rounded-xl p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-white/40">Parameter Map</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-[10px] text-white/30 hover:text-white/60"
        >
          ▾
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={GRID_PX}
        height={GRID_PX}
        className="cursor-crosshair rounded"
        onClick={handleClick}
        style={{ width: GRID_PX, height: GRID_PX }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-white/30">{axisX}: {(currentParams[axisX] ?? 0).toFixed(3)}</span>
        <span className="text-[8px] font-mono text-white/30">{axisY}: {(currentParams[axisY] ?? 0).toFixed(3)}</span>
      </div>
    </div>
  );
}
