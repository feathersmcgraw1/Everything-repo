import { useSimulation } from '../store/simulation';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause simulation' },
  { key: '1–6', action: 'Select brush tool' },
  { key: '[ / ]', action: 'Decrease / Increase brush size' },
  { key: 'R', action: 'Reset simulation (keep parameters)' },
  { key: 'N', action: 'New random seed' },
  { key: 'M', action: 'Toggle parameter map' },
  { key: 'T', action: 'Toggle timeline' },
  { key: 'S', action: 'Screenshot (PNG download)' },
  { key: 'F', action: 'Toggle fullscreen' },
  { key: '?', action: 'Show this overlay' },
  { key: 'Ctrl+Z', action: 'Undo last brush stroke' },
];

export default function ShortcutOverlay() {
  const { panels, setPanel } = useSimulation();

  if (!panels.shortcutOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setPanel('shortcutOverlay', false)}
    >
      <div
        className="glass rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/90">Keyboard Shortcuts</h2>
          <button
            onClick={() => setPanel('shortcutOverlay', false)}
            className="text-white/30 hover:text-white/60"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <kbd className="shrink-0 w-20 text-center px-2 py-0.5 rounded bg-chrome text-cyan text-xs font-mono border border-white/10">
                {s.key}
              </kbd>
              <span className="text-sm text-white/60">{s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
