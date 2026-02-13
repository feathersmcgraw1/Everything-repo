import { useRef, useEffect, useCallback } from 'react';
import { useSimulation, interpolateKeyframes } from '../store/simulation';
import { getEngine } from './Canvas';

export default function Timeline() {
  const playbackRef = useRef<number>(0);
  const {
    panels, keyframes, playback,
    addKeyframe, removeKeyframe,
    setPlaybackPlaying, setPlaybackTime, setPlaybackSpeed, setPlaybackLoop, setPlaybackDuration,
  } = useSimulation();

  if (!panels.timeline) return null;

  const { playing, time, speed, loop, duration } = playback;

  // Playback loop
  useEffect(() => {
    if (!playing || keyframes.length < 2) return;

    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const state = useSimulation.getState();
      let newTime = state.playback.time + dt * state.playback.speed;

      if (newTime >= state.playback.duration) {
        if (state.playback.loop) {
          newTime = 0;
        } else {
          setPlaybackPlaying(false);
          return;
        }
      }

      setPlaybackTime(newTime);

      // Interpolate and apply
      const interp = interpolateKeyframes(state.keyframes, newTime);
      if (interp) {
        const engine = getEngine();
        if (engine) {
          engine.setModel(interp.model);
          engine.setParams(interp.params);
        }
      }

      playbackRef.current = requestAnimationFrame(tick);
    };

    playbackRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(playbackRef.current);
  }, [playing, keyframes.length]);

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const newTime = x * duration;
    setPlaybackTime(Math.max(0, Math.min(duration, newTime)));

    const interp = interpolateKeyframes(keyframes, newTime);
    if (interp) {
      const engine = getEngine();
      if (engine) {
        engine.setModel(interp.model);
        engine.setParams(interp.params);
      }
    }
  }, [duration, keyframes, setPlaybackTime]);

  const handleAddKeyframe = () => {
    addKeyframe(time);
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="glass absolute bottom-0 left-0 right-0 z-20 panel-transition">
      <div className="px-4 py-2">
        {/* Controls row */}
        <div className="flex items-center gap-3 mb-2">
          {/* Play/Pause */}
          <button
            onClick={() => setPlaybackPlaying(!playing)}
            className="w-7 h-7 rounded flex items-center justify-center text-sm hover:bg-white/5"
            disabled={keyframes.length < 2}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* Loop */}
          <button
            onClick={() => setPlaybackLoop(!loop)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono ${loop ? 'text-cyan' : 'text-white/30'}`}
          >
            LOOP
          </button>

          {/* Speed */}
          <div className="flex gap-0.5">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                  speed === s ? 'text-cyan bg-cyan/10' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Time display */}
          <span className="text-[10px] font-mono text-white/40">
            {time.toFixed(1)}s / {duration.toFixed(0)}s
          </span>

          {/* Duration */}
          <input
            type="number"
            min={1}
            max={120}
            value={duration}
            onChange={(e) => setPlaybackDuration(parseFloat(e.target.value))}
            className="w-12 bg-chrome/50 border border-glass-border rounded px-1 py-0.5 text-[10px] font-mono text-white/60"
          />

          {/* Add keyframe */}
          <button
            onClick={handleAddKeyframe}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-amber hover:bg-amber/10"
          >
            + Key
          </button>

          {/* Export trigger (handled in App via export utility) */}
          <button
            className="px-2 py-0.5 rounded text-[10px] font-mono text-white/50 hover:text-white/70 hover:bg-white/5"
            onClick={() => {/* export handled in App */}}
          >
            Export
          </button>
        </div>

        {/* Timeline track */}
        <div
          className="relative h-6 bg-chrome/30 rounded cursor-pointer"
          onClick={handleScrub}
        >
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan z-10"
            style={{ left: `${(time / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan rounded-full" />
          </div>

          {/* Keyframes */}
          {keyframes.map((kf, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-amber/70 border border-amber cursor-grab hover:scale-125 transition-transform"
              style={{ left: `${(kf.time / duration) * 100}%`, marginLeft: -6 }}
              title={`KF${i + 1}: ${kf.time.toFixed(1)}s`}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) removeKeyframe(i);
              }}
            />
          ))}
        </div>

        <div className="text-[8px] text-white/20 mt-1">
          Click to scrub. Click + Key to add keyframe at current time. Shift+click diamond to remove.
        </div>
      </div>
    </div>
  );
}
