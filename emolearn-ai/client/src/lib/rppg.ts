export class rPPGProcessor {
  private greenBuffer: number[] = [];
  private readonly BUFFER = 150;
  private readonly FPS = 30;

  processFrame(imageData: ImageData): number | null {
    const { data, width, height } = imageData;
    const fx = Math.floor(width * 0.3);
    const fy = Math.floor(height * 0.2);
    const fw = Math.floor(width * 0.4);
    const fh = Math.floor(height * 0.4);

    let sum = 0, count = 0;
    for (let y = fy; y < fy + fh; y++) {
      for (let x = fx; x < fx + fw; x++) {
        sum += data[(y * width + x) * 4 + 1]; // green channel
        count++;
      }
    }

    this.greenBuffer.push(sum / count);
    if (this.greenBuffer.length > this.BUFFER) this.greenBuffer.shift();

    return this.greenBuffer.length >= this.BUFFER ? this.calcBPM() : null;
  }

  private calcBPM(): number {
    const sig = this.greenBuffer;
    const mean = sig.reduce((a, b) => a + b) / sig.length;
    const norm = sig.map(v => v - mean);
    const fft = this.fft(norm);
    const freqs = fft.map((_, i) => (i * this.FPS) / this.BUFFER);

    let maxP = 0, freq = 1.2;
    freqs.forEach((f, i) => {
      if (f >= 0.8 && f <= 3.0 && Math.abs(fft[i]) > maxP) {
        maxP = Math.abs(fft[i]);
        freq = f;
      }
    });
    return Math.round(freq * 60);
  }

  private fft(sig: number[]): number[] {
    return sig.map((_, k) => {
      let r = 0, im = 0;
      sig.forEach((s, n) => {
        const a = (2 * Math.PI * k * n) / sig.length;
        r += s * Math.cos(a);
        im -= s * Math.sin(a);
      });
      return Math.sqrt(r * r + im * im);
    });
  }

  reset(): void {
    this.greenBuffer = [];
  }
}
