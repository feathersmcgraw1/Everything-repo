import type { ModelType, ModelParams, Keyframe, InitialCondition } from '../types';

interface DNAPayload {
  model: ModelType;
  params: ModelParams;
  keyframes: Keyframe[];
  initialCondition: InitialCondition;
}

const MODEL_IDS: Record<ModelType, number> = {
  'gray-scott': 0,
  'fitzhugh-nagumo': 1,
  'schnakenberg': 2,
  'brusselator': 3,
};

const ID_TO_MODEL: Record<number, ModelType> = {
  0: 'gray-scott',
  1: 'fitzhugh-nagumo',
  2: 'schnakenberg',
  3: 'brusselator',
};

const IC_IDS: Record<InitialCondition, number> = {
  center: 0, noise: 1, symmetric: 2, text: 3, clear: 4,
};

const ID_TO_IC: Record<number, InitialCondition> = {
  0: 'center', 1: 'noise', 2: 'symmetric', 3: 'text', 4: 'clear',
};

export function encodeDNA(payload: DNAPayload): string {
  const obj = {
    m: MODEL_IDS[payload.model],
    p: payload.params,
    ic: IC_IDS[payload.initialCondition],
    kf: payload.keyframes.length > 0 ? payload.keyframes.map(kf => ({
      t: Math.round(kf.time * 100) / 100,
      m: MODEL_IDS[kf.model],
      p: kf.params,
      e: kf.easing === 'ease-in-out' ? 1 : 0,
    })) : undefined,
  };

  const json = JSON.stringify(obj);
  // Simple Base64url encoding
  const encoded = btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encoded;
}

export function decodeDNA(dna: string): DNAPayload | null {
  try {
    // Restore Base64 padding
    let b64 = dna.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = atob(b64);
    const obj = JSON.parse(json);

    const model = ID_TO_MODEL[obj.m] ?? 'gray-scott';
    const params = obj.p as ModelParams;
    const initialCondition = ID_TO_IC[obj.ic] ?? 'center';
    const keyframes: Keyframe[] = (obj.kf ?? []).map((kf: any) => ({
      time: kf.t,
      model: ID_TO_MODEL[kf.m] ?? model,
      params: kf.p,
      easing: kf.e === 1 ? 'ease-in-out' : 'linear',
    }));

    return { model, params, keyframes, initialCondition };
  } catch {
    console.warn('Failed to decode Pattern DNA');
    return null;
  }
}

export function loadDNAFromURL(): DNAPayload | null {
  const hash = window.location.hash;
  const prefix = '#dna=';
  if (!hash.startsWith(prefix)) return null;
  return decodeDNA(hash.slice(prefix.length));
}
