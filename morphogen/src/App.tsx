import { useEffect, useRef, useState } from 'react';
import Canvas, { getEngine } from './components/Canvas';
import TopBar from './components/TopBar';
import ParameterDrawer from './components/ParameterDrawer';
import ToolPalette from './components/ToolPalette';
import ParameterMap from './components/ParameterMap';
import PresetLibrary from './components/PresetLibrary';
import ColormapSelector from './components/ColormapSelector';
import Timeline from './components/Timeline';
import ShareDialog from './components/ShareDialog';
import ShortcutOverlay from './components/ShortcutOverlay';
import { useSimulation } from './store/simulation';
import { SonificationEngine } from './audio/sonification';
import { loadDNAFromURL } from './utils/dna';
import type { ToolType } from './types';

const TOOL_KEYS: Record<string, ToolType> = {
  '1': 'inject', '2': 'erase', '3': 'wall',
  '4': 'wall-eraser', '5': 'attractor', '6': 'repeller',
};

function Onboarding() {
  const { onboardingDone, setOnboardingDone } = useSimulation();
  const [step, setStep] = useState(0);

  if (onboardingDone) return null;

  const tips = [
    { title: 'Welcome to Morphogen', text: 'An interactive Turing pattern explorer. Click anywhere on the canvas to inject chemicals and watch patterns emerge.' },
    { title: 'Explore Parameters', text: 'Click the model name in the top bar to open the parameter drawer. Adjust feed rate and kill rate to discover different pattern types.' },
    { title: 'Tools & Shortcuts', text: 'Use keys 1-6 to switch tools. Press ? for all keyboard shortcuts. Scroll to change brush size.' },
  ];

  const tip = tips[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-32 pointer-events-none">
      <div className="glass rounded-2xl p-5 max-w-sm pointer-events-auto">
        <h3 className="text-sm font-semibold text-cyan mb-1">{tip.title}</h3>
        <p className="text-xs text-white/60 mb-3">{tip.text}</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {tips.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-cyan' : 'bg-white/20'}`} />
            ))}
          </div>
          <div className="flex-1" />
          {step < tips.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="text-xs text-cyan hover:text-cyan/80">
              Next
            </button>
          ) : (
            <button onClick={() => setOnboardingDone(true)} className="text-xs text-cyan hover:text-cyan/80">
              Got it!
            </button>
          )}
          <button onClick={() => setOnboardingDone(true)} className="text-xs text-white/30 hover:text-white/50">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function BioluminescentBorder() {
  const { activityLevel } = useSimulation();
  const opacity = 0.1 + activityLevel * 0.4;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        boxShadow: `inset 0 0 60px rgba(0, 229, 255, ${opacity * 0.3}), inset 0 0 120px rgba(0, 229, 255, ${opacity * 0.1})`,
        transition: 'box-shadow 0.5s ease',
      }}
    />
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 glass rounded-lg px-4 py-2 text-xs text-cyan">
      {message}
    </div>
  );
}

export default function App() {
  const sonificationRef = useRef<SonificationEngine | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    running, audioEnabled, volume,
    setActiveTool, setBrushRadius,
    toggleRunning, togglePanel, setPanel,
    setModel,
  } = useSimulation();

  // Load Pattern DNA from URL on mount
  useEffect(() => {
    const dna = loadDNAFromURL();
    if (dna) {
      setModel(dna.model);
      useSimulation.setState((s) => ({
        params: { ...s.params, [dna.model]: { ...dna.params } },
        keyframes: dna.keyframes,
        initialCondition: dna.initialCondition,
      }));
      setTimeout(() => {
        const engine = getEngine();
        if (engine) {
          engine.setModel(dna.model);
          engine.setParams(dna.params);
          engine.resetState(dna.initialCondition);
        }
      }, 100);
      setToast(`Loaded shared pattern: ${dna.model.replace(/-/g, ' ')}`);
    }
  }, []);

  // Sonification
  useEffect(() => {
    if (audioEnabled) {
      if (!sonificationRef.current) {
        sonificationRef.current = new SonificationEngine();
      }
      sonificationRef.current.start();
      sonificationRef.current.setVolume(volume);

      const interval = setInterval(() => {
        const engine = getEngine();
        if (engine && running) {
          const vData = engine.readVChannel(64);
          sonificationRef.current?.update(vData, 64);
        }
      }, 160);

      return () => clearInterval(interval);
    } else {
      sonificationRef.current?.stop();
    }
  }, [audioEnabled, running, volume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key;

      if (key === ' ') {
        e.preventDefault();
        toggleRunning();
      } else if (key in TOOL_KEYS) {
        setActiveTool(TOOL_KEYS[key]);
      } else if (key === '[') {
        setBrushRadius(useSimulation.getState().brushRadius - 5);
      } else if (key === ']') {
        setBrushRadius(useSimulation.getState().brushRadius + 5);
      } else if (key.toLowerCase() === 'r') {
        getEngine()?.resetState(useSimulation.getState().initialCondition);
      } else if (key.toLowerCase() === 'n') {
        getEngine()?.resetState('noise');
      } else if (key.toLowerCase() === 'm') {
        togglePanel('paramMap');
      } else if (key.toLowerCase() === 't') {
        togglePanel('timeline');
      } else if (key.toLowerCase() === 's') {
        getEngine()?.screenshot();
      } else if (key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      } else if (key === '?') {
        setPanel('shortcutOverlay', true);
      } else if (key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        getEngine()?.undo();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleRunning, setActiveTool, setBrushRadius, togglePanel, setPanel]);

  // Debug: log that React is rendering
  useEffect(() => {
    console.log('Morphogen App mounted');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#0a0e14' }}>
      <Canvas />
      <BioluminescentBorder />
      <TopBar />
      <ParameterDrawer />
      <ToolPalette />
      <ParameterMap />
      <PresetLibrary />
      <ColormapSelector />
      <Timeline />
      <ShareDialog />
      <ShortcutOverlay />
      <Onboarding />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
