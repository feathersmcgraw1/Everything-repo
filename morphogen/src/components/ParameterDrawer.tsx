import { useSimulation, MODEL_CONFIGS } from '../store/simulation';
import type { ModelType } from '../types';

const MODELS: ModelType[] = ['gray-scott', 'fitzhugh-nagumo', 'schnakenberg', 'brusselator'];
const GRID_SIZES = [256, 512, 1024];

export default function ParameterDrawer() {
  const {
    model, params, panels, stepsPerFrame, gridSize, initialCondition,
    setModel, setParam, setStepsPerFrame, setGridSize, setInitialCondition,
  } = useSimulation();

  if (!panels.paramDrawer) return null;

  const config = MODEL_CONFIGS[model];
  const currentParams = params[model];

  return (
    <div className="glass absolute top-12 left-0 right-0 z-20 panel-transition overflow-hidden">
      <div className="px-4 py-3">
        {/* Model selector tabs */}
        <div className="flex gap-1 mb-3">
          {MODELS.map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                m === model
                  ? 'bg-cyan/20 text-cyan border border-cyan/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {MODEL_CONFIGS[m].name}
            </button>
          ))}
        </div>

        {/* Parameter sliders */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {config.paramDefs.map((def) => (
            <div key={def.key} className="flex items-center gap-2 min-w-[200px]">
              <label className="text-xs font-mono text-white/50 w-24 shrink-0">{def.label}</label>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={currentParams[def.key] ?? def.default}
                onChange={(e) => setParam(def.key, parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min={def.min}
                max={def.max}
                step={def.step}
                value={currentParams[def.key] ?? def.default}
                onChange={(e) => setParam(def.key, parseFloat(e.target.value))}
                className="w-16 bg-chrome/50 border border-glass-border rounded px-1 py-0.5 text-xs font-mono text-cyan text-right"
              />
            </div>
          ))}

          {/* Steps per frame */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs font-mono text-white/50 w-24 shrink-0">Steps/Frame</label>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={stepsPerFrame}
              onChange={(e) => setStepsPerFrame(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-16 text-xs font-mono text-cyan text-right">{stepsPerFrame}</span>
          </div>

          {/* Grid size */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs font-mono text-white/50 w-24 shrink-0">Grid Size</label>
            <div className="flex gap-1">
              {GRID_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    size === gridSize
                      ? 'bg-cyan/20 text-cyan border border-cyan/30'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Initial condition */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <label className="text-xs font-mono text-white/50 w-24 shrink-0">Initial</label>
            <div className="flex gap-1">
              {(['center', 'noise', 'symmetric', 'clear'] as const).map((ic) => (
                <button
                  key={ic}
                  onClick={() => setInitialCondition(ic)}
                  className={`px-2 py-0.5 rounded text-xs font-mono capitalize ${
                    ic === initialCondition
                      ? 'bg-amber/20 text-amber border border-amber/30'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
