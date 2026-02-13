import { useState, useEffect } from 'react';
import { useSimulation } from '../store/simulation';
import { encodeDNA } from '../utils/dna';

export default function ShareDialog() {
  const { panels, setPanel, model, params, keyframes, initialCondition } = useSimulation();
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!panels.shareDialog) return;
    const dna = encodeDNA({
      model,
      params: params[model],
      keyframes,
      initialCondition,
    });
    setUrl(`${window.location.origin}${window.location.pathname}#dna=${dna}`);
  }, [panels.shareDialog, model, params, keyframes, initialCondition]);

  if (!panels.shareDialog) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setPanel('shareDialog', false)}
    >
      <div
        className="glass rounded-2xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/90">Share Pattern</h2>
          <button
            onClick={() => setPanel('shareDialog', false)}
            className="text-white/30 hover:text-white/60"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-white/40 mb-3">
          Share this URL to let others view your pattern configuration:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 bg-chrome/50 border border-glass-border rounded px-3 py-2 text-xs font-mono text-white/70"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-cyan/20 text-cyan hover:bg-cyan/30'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {url.length > 2000 && (
          <p className="text-[10px] text-amber/60 mt-2">
            Note: URL exceeds 2000 characters. Some data may be truncated.
          </p>
        )}
      </div>
    </div>
  );
}
