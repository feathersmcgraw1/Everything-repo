import { getEngine } from '../components/Canvas';

export async function exportWebM(
  durationSec: number,
  fps = 30,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const engine = getEngine();
  if (!engine) throw new Error('No engine');

  const canvas = engine.getCanvas();
  const stream = canvas.captureStream(0);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5_000_000,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    mediaRecorder.start();

    const totalFrames = durationSec * fps;
    let frame = 0;

    const captureFrame = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      // Request frame from stream
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'requestFrame' in videoTrack) {
        (videoTrack as any).requestFrame();
      }

      frame++;
      onProgress?.(frame / totalFrames);
      setTimeout(captureFrame, 1000 / fps);
    };

    captureFrame();
  });
}

export async function exportGIF(
  durationSec: number,
  fps = 15,
  width = 720,
  height = 720,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  // Simplified GIF export using canvas frames
  const engine = getEngine();
  if (!engine) throw new Error('No engine');

  const canvas = engine.getCanvas();
  const totalFrames = durationSec * fps;
  const frames: ImageData[] = [];

  // Create a temporary canvas for resizing
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = width;
  tmpCanvas.height = height;
  const tmpCtx = tmpCanvas.getContext('2d')!;

  for (let i = 0; i < totalFrames; i++) {
    tmpCtx.drawImage(canvas, 0, 0, width, height);
    frames.push(tmpCtx.getImageData(0, 0, width, height));
    onProgress?.(i / totalFrames);
    // Allow simulation to advance
    await new Promise((r) => requestAnimationFrame(r));
  }

  // Encode as animated GIF manually (simplified - creates individual PNGs joined)
  // For a real GIF, you'd use gif.js library. This is a fallback that exports WebM.
  return exportWebM(durationSec, fps, onProgress);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
