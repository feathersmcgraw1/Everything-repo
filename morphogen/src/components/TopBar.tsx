import { useSimulation, MODEL_CONFIGS } from '../store/simulation';

export default function TopBar() {
  const {
    model, running, toggleRunning, audioEnabled, toggleAudio,
    panels, togglePanel, setPanel,
  } = useSimulation();

  const config = MODEL_CONFIGS[model];

  return (
    <div className="glass absolute top-0 left-0 right-0 h-12 z-30 flex items-center px-4 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan to-amber opacity-80" />
        <span className="font-semibold text-sm tracking-wide text-white/90">Morphogen</span>
      </div>

      {/* Model name / param drawer toggle */}
      <button
        onClick={() => togglePanel('paramDrawer')}
        className="ml-4 px-3 py-1 rounded-md text-xs font-mono text-cyan hover:bg-white/5 transition-colors"
        title="Toggle parameter drawer"
      >
        {config.name}
        <span className="ml-1 text-white/30">{panels.paramDrawer ? '▴' : '▾'}</span>
      </button>

      <div className="flex-1" />

      {/* Play/Pause */}
      <button
        onClick={toggleRunning}
        className="px-3 py-1 rounded-md text-xs font-mono hover:bg-white/5 transition-colors"
        title={running ? 'Pause (Space)' : 'Play (Space)'}
      >
        {running ? '⏸ Pause' : '▶ Play'}
      </button>

      {/* Presets */}
      <button
        onClick={() => togglePanel('presets')}
        className={`px-3 py-1 rounded-md text-xs hover:bg-white/5 transition-colors ${panels.presets ? 'text-cyan' : 'text-white/70'}`}
        title="Presets"
      >
        Presets
      </button>

      {/* Parameter Map */}
      <button
        onClick={() => togglePanel('paramMap')}
        className={`px-3 py-1 rounded-md text-xs hover:bg-white/5 transition-colors ${panels.paramMap ? 'text-cyan' : 'text-white/70'}`}
        title="Parameter Map (M)"
      >
        Map
      </button>

      {/* Timeline */}
      <button
        onClick={() => togglePanel('timeline')}
        className={`px-3 py-1 rounded-md text-xs hover:bg-white/5 transition-colors ${panels.timeline ? 'text-cyan' : 'text-white/70'}`}
        title="Timeline (T)"
      >
        Timeline
      </button>

      {/* Share */}
      <button
        onClick={() => setPanel('shareDialog', true)}
        className="px-3 py-1 rounded-md text-xs text-white/70 hover:bg-white/5 transition-colors"
        title="Share"
      >
        Share
      </button>

      {/* Settings / Colormap */}
      <button
        onClick={() => togglePanel('colormapSelector')}
        className={`px-2 py-1 rounded-md text-sm hover:bg-white/5 transition-colors ${panels.colormapSelector ? 'text-cyan' : 'text-white/50'}`}
        title="Settings"
      >
        ⚙
      </button>

      {/* Audio toggle */}
      <button
        onClick={toggleAudio}
        className={`px-2 py-1 rounded-md text-sm hover:bg-white/5 transition-colors ${audioEnabled ? 'text-amber' : 'text-white/30'}`}
        title="Toggle audio"
      >
        {audioEnabled ? '♪' : '♪'}
      </button>

      {/* Shortcuts help */}
      <button
        onClick={() => setPanel('shortcutOverlay', true)}
        className="px-2 py-1 rounded-md text-xs text-white/30 hover:bg-white/5 transition-colors"
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>
    </div>
  );
}
