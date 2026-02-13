export type ModelType = 'gray-scott' | 'fitzhugh-nagumo' | 'schnakenberg' | 'brusselator';

export type ToolType = 'inject' | 'erase' | 'wall' | 'wall-eraser' | 'attractor' | 'repeller';

export type InitialCondition = 'center' | 'noise' | 'symmetric' | 'text' | 'clear';

export type EasingType = 'linear' | 'ease-in-out';

export type ColormapName =
  | 'viridis' | 'magma' | 'inferno' | 'plasma'
  | 'twilight' | 'bone' | 'bioluminescent' | 'grayscale';

export interface ModelParams {
  [key: string]: number;
}

export interface ModelParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface ModelConfig {
  id: ModelType;
  name: string;
  paramDefs: ModelParamDef[];
  defaults: ModelParams;
  primaryAxes: [string, string];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'Classic Turing' | 'Waves & Spirals' | 'Exotic' | 'Artistic';
  model: ModelType;
  params: ModelParams;
  initialCondition: InitialCondition;
  colormap: ColormapName;
}

export interface Keyframe {
  time: number;
  model: ModelType;
  params: ModelParams;
  easing: EasingType;
}

export interface BrushConfig {
  tool: ToolType;
  radius: number;
  intensity: number;
  square: boolean;
}

export interface PlaybackState {
  playing: boolean;
  time: number;
  speed: number;
  loop: boolean;
  duration: number;
}

export interface PanelVisibility {
  paramMap: boolean;
  paramDrawer: boolean;
  timeline: boolean;
  presets: boolean;
  colormapSelector: boolean;
  shareDialog: boolean;
  shortcutOverlay: boolean;
}

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  zoom: number;
}
