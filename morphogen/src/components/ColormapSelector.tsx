import { useRef, useEffect } from 'react';
import { useSimulation } from '../store/simulation';
import { COLORMAP_NAMES, getColormapPreviewData } from '../gl/colormaps';
import type { ColormapName } from '../types';

function ColormapPreview({ name, active }: { name: ColormapName; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const data = getColormapPreviewData(name);
    const imgData = ctx.createImageData(64, 1);
    imgData.data.set(data);
    ctx.putImageData(imgData, 0, 0);
  }, [name]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={1}
      className={`w-full h-4 rounded cursor-pointer ${
        active ? 'ring-2 ring-cyan ring-offset-1 ring-offset-deep' : ''
      }`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function ColormapSelector() {
  const { colormap, setColormap, panels, setPanel } = useSimulation();

  if (!panels.colormapSelector) return null;

  return (
    <div className="glass absolute top-14 right-3 z-20 rounded-xl p-3 w-56">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/70">Colormaps</span>
        <button
          onClick={() => setPanel('colormapSelector', false)}
          className="text-white/30 hover:text-white/60 text-xs"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1.5">
        {COLORMAP_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setColormap(name)}
            className="w-full text-left"
          >
            <ColormapPreview name={name} active={name === colormap} />
            <span className="text-[9px] font-mono text-white/40 capitalize">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
