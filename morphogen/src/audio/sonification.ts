import { analyze2D, type FFTResult } from '../utils/fft';

export class SonificationEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Oscillator banks
  private lowOsc: OscillatorNode | null = null;
  private lowGain: GainNode | null = null;
  private midOsc: OscillatorNode | null = null;
  private midGain: GainNode | null = null;
  private highOsc: OscillatorNode | null = null;
  private highGain: GainNode | null = null;

  // Noise for texture
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private running = false;
  private frameCount = 0;
  private updateInterval = 10; // Update every N frames

  // Smoothed values
  private smoothLow = 0;
  private smoothMid = 0;
  private smoothHigh = 0;
  private smoothing = 0.85;

  init() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    // Low drone (bass)
    this.lowOsc = this.ctx.createOscillator();
    this.lowOsc.type = 'sine';
    this.lowOsc.frequency.value = 55; // A1
    this.lowGain = this.ctx.createGain();
    this.lowGain.gain.value = 0;
    this.lowOsc.connect(this.lowGain);
    this.lowGain.connect(this.masterGain);
    this.lowOsc.start();

    // Mid pad (triangle wave for warmth)
    this.midOsc = this.ctx.createOscillator();
    this.midOsc.type = 'triangle';
    this.midOsc.frequency.value = 220; // A3
    this.midGain = this.ctx.createGain();
    this.midGain.gain.value = 0;
    this.midOsc.connect(this.midGain);
    this.midGain.connect(this.masterGain);
    this.midOsc.start();

    // High shimmer (sawtooth filtered)
    this.highOsc = this.ctx.createOscillator();
    this.highOsc.type = 'sawtooth';
    this.highOsc.frequency.value = 880; // A5
    this.highGain = this.ctx.createGain();
    this.highGain.gain.value = 0;
    // Add a low-pass filter for the shimmer
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;
    this.highOsc.connect(filter);
    filter.connect(this.highGain);
    this.highGain.connect(this.masterGain);
    this.highOsc.start();

    // Noise layer for texture
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 0.5;
    this.noiseSource.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start();
  }

  setVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v * 0.5, this.ctx!.currentTime, 0.1);
    }
  }

  start() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.running = true;
  }

  stop() {
    this.running = false;
    // Fade out all gains
    const t = this.ctx?.currentTime ?? 0;
    this.lowGain?.gain.setTargetAtTime(0, t, 0.5);
    this.midGain?.gain.setTargetAtTime(0, t, 0.5);
    this.highGain?.gain.setTargetAtTime(0, t, 0.5);
    this.noiseGain?.gain.setTargetAtTime(0, t, 0.5);
  }

  // Call this every frame from the render loop
  update(vChannelData: Float32Array | null, size: number) {
    if (!this.running || !this.ctx || !vChannelData) return;

    this.frameCount++;
    if (this.frameCount % this.updateInterval !== 0) return;

    const result = analyze2D(vChannelData, size);
    this.applyFFTResult(result);
  }

  private applyFFTResult(result: FFTResult) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Smooth the values
    this.smoothLow = this.smoothLow * this.smoothing + result.lowEnergy * (1 - this.smoothing);
    this.smoothMid = this.smoothMid * this.smoothing + result.midEnergy * (1 - this.smoothing);
    this.smoothHigh = this.smoothHigh * this.smoothing + result.highEnergy * (1 - this.smoothing);

    // Map to gain values (logarithmic scaling for better perception)
    const lowVol = Math.min(0.4, this.smoothLow * 2);
    const midVol = Math.min(0.3, this.smoothMid * 3);
    const highVol = Math.min(0.15, this.smoothHigh * 5);
    const noiseVol = Math.min(0.05, this.smoothHigh * 1);

    this.lowGain?.gain.setTargetAtTime(lowVol, t, 0.3);
    this.midGain?.gain.setTargetAtTime(midVol, t, 0.2);
    this.highGain?.gain.setTargetAtTime(highVol, t, 0.15);
    this.noiseGain?.gain.setTargetAtTime(noiseVol, t, 0.2);

    // Slightly modulate frequencies based on energy distribution
    const midFreq = 180 + this.smoothMid * 200;
    const highFreq = 600 + this.smoothHigh * 800;
    this.midOsc?.frequency.setTargetAtTime(midFreq, t, 0.5);
    this.highOsc?.frequency.setTargetAtTime(highFreq, t, 0.5);
  }

  destroy() {
    this.stop();
    this.lowOsc?.stop();
    this.midOsc?.stop();
    this.highOsc?.stop();
    this.noiseSource?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
