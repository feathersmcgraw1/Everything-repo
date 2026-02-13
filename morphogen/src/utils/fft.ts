// Simplified 2D FFT for sonification (operates on a small downsampled grid)

export function fft1d(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1) return;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Cooley-Tukey FFT
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tRe = curRe * re[b] - curIm * im[b];
        const tIm = curRe * im[b] + curIm * re[b];
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const newRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newRe;
      }
    }
  }
}

export interface FFTResult {
  lowEnergy: number;   // Large blobs (low spatial frequency)
  midEnergy: number;   // Spots/stripes (medium frequency)
  highEnergy: number;  // Fine detail (high frequency)
  totalEnergy: number;
}

export function analyze2D(data: Float32Array, size: number): FFTResult {
  // Run row-wise FFT, then column-wise
  const re = new Float32Array(size * size);
  const im = new Float32Array(size * size);
  re.set(data);

  // Row FFT
  const rowRe = new Float32Array(size);
  const rowIm = new Float32Array(size);
  for (let y = 0; y < size; y++) {
    const offset = y * size;
    rowRe.set(re.subarray(offset, offset + size));
    rowIm.fill(0);
    fft1d(rowRe, rowIm);
    re.set(rowRe, offset);
    im.set(rowIm, offset);
  }

  // Column FFT
  const colRe = new Float32Array(size);
  const colIm = new Float32Array(size);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      colRe[y] = re[y * size + x];
      colIm[y] = im[y * size + x];
    }
    fft1d(colRe, colIm);
    for (let y = 0; y < size; y++) {
      re[y * size + x] = colRe[y];
      im[y * size + x] = colIm[y];
    }
  }

  // Compute power spectrum and bin into frequency bands
  const half = size / 2;
  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;
  let totalEnergy = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const power = re[idx] * re[idx] + im[idx] * im[idx];
      totalEnergy += power;

      // Frequency = distance from DC component (center)
      const fx = x < half ? x : size - x;
      const fy = y < half ? y : size - y;
      const freq = Math.sqrt(fx * fx + fy * fy);
      const maxFreq = half * Math.SQRT2;
      const normFreq = freq / maxFreq;

      if (normFreq < 0.15) {
        lowEnergy += power;
      } else if (normFreq < 0.5) {
        midEnergy += power;
      } else {
        highEnergy += power;
      }
    }
  }

  // Normalize
  const norm = totalEnergy > 0 ? 1 / totalEnergy : 0;
  return {
    lowEnergy: lowEnergy * norm,
    midEnergy: midEnergy * norm,
    highEnergy: highEnergy * norm,
    totalEnergy,
  };
}
