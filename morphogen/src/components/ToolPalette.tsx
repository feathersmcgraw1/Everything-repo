import { useSimulation } from '../store/simulation';
import type { ToolType } from '../types';

const TOOLS: { type: ToolType; icon: string; label: string; key: string }[] = [
  { type: 'inject', icon: '💧', label: 'Inject', key: '1' },
  { type: 'erase', icon: '🧹', label: 'Erase', key: '2' },
  { type: 'wall', icon: '🧱', label: 'Wall', key: '3' },
  { type: 'wall-eraser', icon: '🔓', label: 'Wall Eraser', key: '4' },
  { type: 'attractor', icon: '🧲', label: 'Attractor', key: '5' },
  { type: 'repeller', icon: '🛡️', label: 'Repeller', key: '6' },
];

export default function ToolPalette() {
  const { activeTool, setActiveTool, brushRadius, setBrushRadius, brushIntensity, setBrushIntensity } = useSimulation();

  return (
    <div className="glass absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-xl p-2 flex flex-col gap-1">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setActiveTool(tool.type)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
            activeTool === tool.type
              ? 'bg-cyan/20 ring-1 ring-cyan/50 scale-110'
              : 'hover:bg-white/5'
          }`}
          title={`${tool.label} (${tool.key})`}
        >
          {tool.icon}
        </button>
      ))}

      {/* Brush size */}
      <div className="mt-2 pt-2 border-t border-white/5">
        <div className="text-[9px] font-mono text-white/30 text-center mb-1">SIZE</div>
        <input
          type="range"
          min={5}
          max={100}
          value={brushRadius}
          onChange={(e) => setBrushRadius(parseInt(e.target.value))}
          className="w-10 h-16"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
        <div className="text-[9px] font-mono text-cyan text-center">{brushRadius}</div>
      </div>

      {/* Brush intensity */}
      <div className="mt-1 pt-1 border-t border-white/5">
        <div className="text-[9px] font-mono text-white/30 text-center mb-1">INT</div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(brushIntensity * 100)}
          onChange={(e) => setBrushIntensity(parseInt(e.target.value) / 100)}
          className="w-10 h-16"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
        <div className="text-[9px] font-mono text-cyan text-center">{Math.round(brushIntensity * 100)}%</div>
      </div>
    </div>
  );
}
