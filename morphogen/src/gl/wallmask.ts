export class WallMask {
  private gl: WebGL2RenderingContext;
  private width: number;
  private height: number;
  private data: Uint8Array;
  texture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
    this.texture = this.createTexture();
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, this.width, this.height, 0, gl.RED, gl.UNSIGNED_BYTE, this.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  paint(x: number, y: number, radius: number, value: boolean, square: boolean) {
    const r = Math.ceil(radius);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(x) + dx;
        const py = Math.round(y) + dy;
        if (px < 0 || px >= this.width || py < 0 || py >= this.height) continue;

        const dist = square ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          this.data[py * this.width + px] = value ? 255 : 0;
        }
      }
    }
    this.upload();
  }

  clear() {
    this.data.fill(0);
    this.upload();
  }

  private upload() {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.width, this.height, gl.RED, gl.UNSIGNED_BYTE, this.data);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
    const gl = this.gl;
    gl.deleteTexture(this.texture);
    this.texture = this.createTexture();
  }

  getData(): Uint8Array {
    return new Uint8Array(this.data);
  }

  setData(data: Uint8Array) {
    this.data.set(data);
    this.upload();
  }

  hasWalls(): boolean {
    return this.data.some(v => v > 0);
  }
}
