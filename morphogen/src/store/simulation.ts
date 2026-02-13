import { create } from 'zustand';
import type {
  ModelType, ToolType, ColormapName, InitialCondition,
  Keyframe, ModelParams, ModelConfig, PlaybackState, PanelVisibility,
} from '../types';

export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  'gray-scott': {
    id: 'gray-scott',
    name: 'Gray-Scott',
    primaryAxes: ['F', 'k'],
    paramDefs: [
      { key: 'F', label: 'Feed Rate (F)', min: 0.01, max: 0.1, step: 0.001, default: 0.037 },
      { key: 'k', label: 'Kill Rate (k)', min: 0.03, max: 0.07, step: 0.001, default: 0.06 },
      { key: 'Du', label: 'Diffusion U', min: 0.05, max: 0.4, step: 0.005, default: 0.21 },
      { key: 'Dv', label: 'Diffusion V', min: 0.02, max: 0.2, step: 0.005, default: 0.105 },
      { key: 'dt', label: 'Time Step', min: 0.5, max: 2.0, step: 0.1, default: 1.0 },
    ],
    defaults: { F: 0.037, k: 0.06, Du: 0.21, Dv: 0.105, dt: 1.0 },
  },
  'fitzhugh-nagumo': {
    id: 'fitzhugh-nagumo',
    name: 'FitzHugh-Nagumo',
    primaryAxes: ['a', 'b'],
    paramDefs: [
      { key: 'a', label: 'a', min: -0.5, max: 1.0, step: 0.01, default: 0.5 },
      { key: 'b', label: 'b', min: 0.0, max: 2.0, step: 0.01, default: 0.8 },
      { key: 'epsilon', label: 'Epsilon', min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
      { key: 'Du', label: 'Diffusion U', min: 0.05, max: 1.0, step: 0.01, default: 0.2 },
      { key: 'Dv', label: 'Diffusion V', min: 0.0, max: 1.0, step: 0.01, default: 0.0 },
      { key: 'dt', label: 'Time Step', min: 0.01, max: 1.0, step: 0.01, default: 0.1 },
    ],
    defaults: { a: 0.5, b: 0.8, epsilon: 0.01, Du: 0.2, Dv: 0.0, dt: 0.1 },
  },
  'schnakenberg': {
    id: 'schnakenberg',
    name: 'Schnakenberg',
    primaryAxes: ['a', 'b'],
    paramDefs: [
      { key: 'a', label: 'a', min: 0.0, max: 0.5, step: 0.005, default: 0.1 },
      { key: 'b', label: 'b', min: 0.5, max: 2.0, step: 0.01, default: 0.9 },
      { key: 'Du', label: 'Diffusion U', min: 0.05, max: 1.0, step: 0.01, default: 0.5 },
      { key: 'Dv', label: 'Diffusion V', min: 0.01, max: 0.5, step: 0.005, default: 0.1 },
      { key: 'dt', label: 'Time Step', min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
    ],
    defaults: { a: 0.1, b: 0.9, Du: 0.5, Dv: 0.1, dt: 0.01 },
  },
  'brusselator': {
    id: 'brusselator',
    name: 'Brusselator',
    primaryAxes: ['a', 'b'],
    paramDefs: [
      { key: 'a', label: 'a', min: 0.5, max: 5.0, step: 0.1, default: 1.0 },
      { key: 'b', label: 'b', min: 1.0, max: 5.0, step: 0.1, default: 3.0 },
      { key: 'Du', label: 'Diffusion U', min: 0.1, max: 2.0, step: 0.01, default: 0.5 },
      { key: 'Dv', label: 'Diffusion V', min: 0.01, max: 1.0, step: 0.005, default: 0.1 },
      { key: 'dt', label: 'Time Step', min: 0.001, max: 0.05, step: 0.001, default: 0.005 },
    ],
    defaults: { a: 1.0, b: 3.0, Du: 0.5, Dv: 0.1, dt: 0.005 },
  },
};

interface SimulationStore {
  // Model
  model: ModelType;
  params: Record<ModelType, ModelParams>;
  setModel: (model: ModelType) => void;
  setParam: (key: string, value: number) => void;
  setAllParams: (params: ModelParams) => void;

  // Simulation control
  running: boolean;
  toggleRunning: () => void;
  setRunning: (v: boolean) => void;
  stepsPerFrame: number;
  setStepsPerFrame: (v: number) => void;
  gridSize: number;
  setGridSize: (v: number) => void;

  // Tools
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  brushRadius: number;
  setBrushRadius: (r: number) => void;
  brushIntensity: number;
  setBrushIntensity: (i: number) => void;

  // Visual
  colormap: ColormapName;
  setColormap: (c: ColormapName) => void;
  initialCondition: InitialCondition;
  setInitialCondition: (ic: InitialCondition) => void;

  // Keyframes & Playback
  keyframes: Keyframe[];
  addKeyframe: (time: number) => void;
  removeKeyframe: (index: number) => void;
  moveKeyframe: (index: number, time: number) => void;
  playback: PlaybackState;
  setPlaybackPlaying: (v: boolean) => void;
  setPlaybackTime: (t: number) => void;
  setPlaybackSpeed: (s: number) => void;
  setPlaybackLoop: (v: boolean) => void;
  setPlaybackDuration: (d: number) => void;

  // Panels
  panels: PanelVisibility;
  togglePanel: (panel: keyof PanelVisibility) => void;
  setPanel: (panel: keyof PanelVisibility, v: boolean) => void;

  // Audio
  audioEnabled: boolean;
  toggleAudio: () => void;
  volume: number;
  setVolume: (v: number) => void;

  // Activity level for border glow
  activityLevel: number;
  setActivityLevel: (v: number) => void;

  // Onboarding
  onboardingDone: boolean;
  setOnboardingDone: (v: boolean) => void;
}

function getDefaultParams(): Record<ModelType, ModelParams> {
  const result: Record<string, ModelParams> = {};
  for (const [key, config] of Object.entries(MODEL_CONFIGS)) {
    result[key] = { ...config.defaults };
  }
  return result as Record<ModelType, ModelParams>;
}

export const useSimulation = create<SimulationStore>((set, get) => ({
  model: 'gray-scott',
  params: getDefaultParams(),
  setModel: (model) => set({ model }),
  setParam: (key, value) => set((s) => ({
    params: { ...s.params, [s.model]: { ...s.params[s.model], [key]: value } },
  })),
  setAllParams: (params) => set((s) => ({
    params: { ...s.params, [s.model]: { ...params } },
  })),

  running: true,
  toggleRunning: () => set((s) => ({ running: !s.running })),
  setRunning: (v) => set({ running: v }),
  stepsPerFrame: 10,
  setStepsPerFrame: (v) => set({ stepsPerFrame: v }),
  gridSize: 512,
  setGridSize: (v) => set({ gridSize: v }),

  activeTool: 'inject',
  setActiveTool: (tool) => set({ activeTool: tool }),
  brushRadius: 20,
  setBrushRadius: (r) => set({ brushRadius: Math.max(5, Math.min(100, r)) }),
  brushIntensity: 0.5,
  setBrushIntensity: (i) => set({ brushIntensity: Math.max(0, Math.min(1, i)) }),

  colormap: 'viridis',
  setColormap: (c) => set({ colormap: c }),
  initialCondition: 'center',
  setInitialCondition: (ic) => set({ initialCondition: ic }),

  keyframes: [],
  addKeyframe: (time) => {
    const s = get();
    const kf: Keyframe = {
      time,
      model: s.model,
      params: { ...s.params[s.model] },
      easing: 'linear',
    };
    set({ keyframes: [...s.keyframes, kf].sort((a, b) => a.time - b.time) });
  },
  removeKeyframe: (index) => set((s) => ({
    keyframes: s.keyframes.filter((_, i) => i !== index),
  })),
  moveKeyframe: (index, time) => set((s) => ({
    keyframes: s.keyframes.map((kf, i) => i === index ? { ...kf, time } : kf).sort((a, b) => a.time - b.time),
  })),
  playback: { playing: false, time: 0, speed: 1, loop: true, duration: 10 },
  setPlaybackPlaying: (v) => set((s) => ({ playback: { ...s.playback, playing: v } })),
  setPlaybackTime: (t) => set((s) => ({ playback: { ...s.playback, time: t } })),
  setPlaybackSpeed: (s) => set((state) => ({ playback: { ...state.playback, speed: s } })),
  setPlaybackLoop: (v) => set((s) => ({ playback: { ...s.playback, loop: v } })),
  setPlaybackDuration: (d) => set((s) => ({ playback: { ...s.playback, duration: d } })),

  panels: {
    paramMap: false,
    paramDrawer: false,
    timeline: false,
    presets: false,
    colormapSelector: false,
    shareDialog: false,
    shortcutOverlay: false,
  },
  togglePanel: (panel) => set((s) => ({
    panels: { ...s.panels, [panel]: !s.panels[panel] },
  })),
  setPanel: (panel, v) => set((s) => ({
    panels: { ...s.panels, [panel]: v },
  })),

  audioEnabled: false,
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  volume: 0.5,
  setVolume: (v) => set({ volume: v }),

  activityLevel: 0,
  setActivityLevel: (v) => set({ activityLevel: v }),

  onboardingDone: localStorage.getItem('morphogen-onboarding-done') === 'true',
  setOnboardingDone: (v) => {
    localStorage.setItem('morphogen-onboarding-done', String(v));
    set({ onboardingDone: v });
  },
}));

// Interpolate between keyframes at a given time
export function interpolateKeyframes(keyframes: Keyframe[], time: number): { model: ModelType; params: ModelParams } | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return { model: keyframes[0].model, params: keyframes[0].params };

  // Find surrounding keyframes
  let before = keyframes[0];
  let after = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      before = keyframes[i];
      after = keyframes[i + 1];
      break;
    }
  }

  if (time <= before.time) return { model: before.model, params: before.params };
  if (time >= after.time) return { model: after.model, params: after.params };

  const range = after.time - before.time;
  let t = range > 0 ? (time - before.time) / range : 0;

  // Apply easing
  if (after.easing === 'ease-in-out') {
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Interpolate params (only works within same model)
  const params: ModelParams = {};
  const allKeys = new Set([...Object.keys(before.params), ...Object.keys(after.params)]);
  for (const key of allKeys) {
    const a = before.params[key] ?? 0;
    const b = after.params[key] ?? 0;
    params[key] = a + (b - a) * t;
  }

  return { model: after.model, params };
}
