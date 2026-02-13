import { useSimulation } from '../store/simulation';
import { PRESETS } from '../models/presets';
import { getEngine } from './Canvas';

const CATEGORIES = ['Classic Turing', 'Waves & Spirals', 'Exotic', 'Artistic'] as const;

export default function PresetLibrary() {
  const { panels, setModel, setColormap, setInitialCondition, setPanel } = useSimulation();

  if (!panels.presets) return null;

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setModel(preset.model);
    // Need to set params for the target model
    useSimulation.setState((s) => ({
      params: { ...s.params, [preset.model]: { ...preset.params } },
    }));
    setColormap(preset.colormap);
    setInitialCondition(preset.initialCondition);
    // Reset the simulation with the preset's initial condition
    setTimeout(() => {
      const engine = getEngine();
      if (engine) {
        engine.setModel(preset.model);
        engine.setParams(preset.params);
        engine.setColormap(preset.colormap);
        engine.resetState(preset.initialCondition);
      }
    }, 50);
  };

  return (
    <div className="glass absolute top-14 left-1/2 -translate-x-1/2 z-20 rounded-xl p-3 max-w-[700px] w-[90vw] max-h-[50vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white/80">Presets</span>
        <button
          onClick={() => setPanel('presets', false)}
          className="text-white/30 hover:text-white/60 text-sm"
        >
          ✕
        </button>
      </div>

      {CATEGORIES.map((cat) => {
        const presets = PRESETS.filter((p) => p.category === cat);
        if (presets.length === 0) return null;
        return (
          <div key={cat} className="mb-3">
            <h3 className="text-[10px] font-mono text-amber/60 uppercase tracking-wider mb-1.5">{cat}</h3>
            <div className="flex gap-2 flex-wrap">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="group w-[140px] rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 hover:border-cyan/20 p-2 text-left transition-all"
                >
                  <div className="w-full h-16 rounded bg-gradient-to-br from-chrome to-deep mb-1.5 flex items-center justify-center text-[10px] font-mono text-white/20 group-hover:text-cyan/40">
                    {preset.model.split('-').map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div className="text-xs font-medium text-white/80 group-hover:text-cyan truncate">{preset.name}</div>
                  <div className="text-[9px] text-white/30 truncate">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
