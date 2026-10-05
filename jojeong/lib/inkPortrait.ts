// 수묵 초상: the captured frame turned into an ink portrait on the viewer's own device. Lines come from an XDoG
// filter (a difference of two blurs, pushed to ink or paper), shadows from a few washes of thinner ink, then a
// skin wash and red lips (배채), a 진영 title and a seal. The source pixels never leave the browser.

import { IDX, type Pt } from "./gwansang";

const OW = 600;
const OH = 770;

function grayBlur(L: Float32Array, sigma: number): Float32Array {
  const n = OW * OH;
  const a = document.createElement("canvas");
  a.width = OW;
  a.height = OH;
  const ag = a.getContext("2d")!;
  const id = ag.createImageData(OW, OH);
  for (let i = 0; i < n; i++) {
    const v = L[i] * 255;
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
    id.data[i * 4 + 3] = 255;
  }
  ag.putImageData(id, 0, 0);
  const b = document.createElement("canvas");
  b.width = OW;
  b.height = OH;
  const bg = b.getContext("2d", { willReadFrequently: true })!;
  bg.fillStyle = "#fff";
  bg.fillRect(0, 0, OW, OH);
  bg.filter = `blur(${sigma}px)`;
  bg.drawImage(a, 0, 0);
  const d = bg.getImageData(0, 0, OW, OH).data;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = d[i * 4] / 255;
  return out;
}

// `src` is the whole frame (w × h pixels); `pts` the face points in 0–1 of it.
export function inkPortrait(src: CanvasImageSource, w0: number, h0: number, pts: Pt[], name: string): HTMLCanvasElement {
  const xs = pts.map((p) => p[0] * w0);
  const ys = pts.map((p) => p[1] * h0);
  const fy0 = Math.min(...ys);
  const fy1 = Math.max(...ys);
  const fh = fy1 - fy0;
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y0 = fy0 - fh * 0.55;
  const h = fh * 2.1;
  const w = h * (OW / OH);

  const c = document.createElement("canvas");
  c.width = OW;
  c.height = OH;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, OW, OH);
  g.drawImage(src, cx - w / 2, y0, w, h, 0, 0, OW, OH);
  const px = g.getImageData(0, 0, OW, OH).data;
  const n = OW * OH;
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;

  const sigma = 1.2;
  const p = 20;
  const eps = 0.68;
  const phi = 12;
  const g1 = grayBlur(L, sigma);
  const g2 = grayBlur(L, sigma * 1.6);
  const wash = grayBlur(L, 5);

  const out = g.createImageData(OW, OH);
  const mcx = OW / 2;
  const mcy = OH * 0.47;
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let y = 0; y < OH; y++)
    for (let x = 0; x < OW; x++) {
      const i = y * OW + x;
      const S = (1 + p) * g1[i] - p * g2[i];
      const line = S >= eps ? 1 : 1 + Math.tanh(phi * (S - eps)); // 1 = paper, 0 = ink
      const t0 = Math.min(1, wash[i] * 1.1);
      const tone = t0 > 0.55 ? 1 : Math.round(t0 * 4) / 4; // bright skin stays paper, shadows take ink
      const dx = (x - mcx) / (OW * 0.46);
      const dy = (y - mcy) / (OH * 0.46);
      const r = Math.sqrt(dx * dx + dy * dy);
      const fade = r < 0.82 ? 1 : Math.max(0, 1 - (r - 0.82) / 0.22); // edges soak into the paper
      const ink = Math.min(1, (1 - Math.max(0, line)) * 0.95 + (1 - tone) * 0.38) * fade;
      const grain = 0.94 + rnd() * 0.06;
      out.data[i * 4] = 233 * grain * (1 - ink) + 38 * ink;
      out.data[i * 4 + 1] = 220 * grain * (1 - ink) + 30 * ink;
      out.data[i * 4 + 2] = 192 * grain * (1 - ink) + 24 * ink;
      out.data[i * 4 + 3] = 255;
    }
  g.putImageData(out, 0, 0);

  // 배채: a soft skin wash over the face, a touch of red on the lips.
  const T = pts.map(([x, y]): Pt => [((x * w0 - (cx - w / 2)) * OW) / w, ((y * h0 - y0) * OH) / h]);
  const fc = T[168];
  const poly = (ids: readonly number[], grow = 1, lift = 0) => {
    const path = new Path2D();
    ids.forEach((id, j) => {
      const x = fc[0] + (T[id][0] - fc[0]) * grow;
      const yy = fc[1] + (T[id][1] - fc[1]) * grow;
      const y = yy < fc[1] ? yy - lift * (fc[1] - yy) : yy;
      if (j) path.lineTo(x, y);
      else path.moveTo(x, y);
    });
    path.closePath();
    return path;
  };
  g.save();
  g.globalCompositeOperation = "multiply";
  g.filter = "blur(16px)";
  g.fillStyle = "rgba(226,178,128,0.36)";
  g.fill(poly(IDX.oval, 1.04, 0.18));
  g.filter = "blur(3px)";
  g.fillStyle = "rgba(196,92,78,0.45)";
  g.fill(poly(IDX.lips));
  g.restore();

  stampTitle(g, OW, name);
  return c;
}

// A 진영 title down the right edge and a red seal under it, sized for a picture `width` pixels wide.
export function stampTitle(g: CanvasRenderingContext2D, width: number, name: string) {
  const k = width / 600;
  const serif = getComputedStyle(document.body).getPropertyValue("--font-myeongjo").trim() || "serif";
  const label = [...name.slice(0, 6), " ", "진", "영"];
  const x = width - 48 * k;
  g.save();
  g.fillStyle = "#2a1d14";
  g.textAlign = "center";
  g.font = `700 ${34 * k}px ${serif}`;
  label.forEach((ch, j) => g.fillText(ch, x, (70 + j * 40) * k));
  const sy = (60 + label.length * 40) * k;
  g.fillStyle = "#b23a2c";
  g.fillRect(x - 20 * k, sy, 40 * k, 40 * k);
  g.fillStyle = "#f6ead8";
  g.font = `700 ${15 * k}px ${serif}`;
  g.fillText(name.replace(/\s/g, "").slice(0, 2), x, sy + 26 * k);
  g.restore();
}
