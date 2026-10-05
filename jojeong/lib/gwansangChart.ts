// 관상 도식: the painted portrait laid out like a face-reading chart. A title with the 오행 type, the painting in
// the middle, notes down both sides with leader lines to the face points they describe, and 성격 / 운세 boxes
// underneath. All text is drawn here (image models write Korean and hanja badly).

import { chartNotes, chartSummary, type Metrics, type Pt } from "./gwansang";

const W = 1080;
const H = 1330; // with the 성격 / 운세 boxes; 1000 without them
const PX = 260;
const PY = 160;
const PW = 560;
const PH = 747;

export type ChartInput = {
  painting: HTMLImageElement;
  paintPts: Pt[] | null; // face points found on the painting itself (0–1), or null when none were found
  facePts: Pt[]; // the captured face's points, for a fallback placement
  m: Metrics;
  title: string; // e.g. "목·수형"
  hanja: string; // e.g. "木水形"
  name: string;
  faceOnly: boolean; // crop the painting to the face
  hidden: number[]; // anchors of the notes the viewer switched off
  boxes: boolean; // the 성격 / 운세 boxes
};

// The part of the painting shown, in its own 0–1 units: the whole of it, or a 3:4 window around the face.
function view(input: ChartInput): { x: number; y: number; w: number; h: number } {
  if (!input.faceOnly) return { x: 0, y: 0, w: 1, h: 1 };
  const pts = input.paintPts;
  const iw = input.painting.naturalWidth;
  const ih = input.painting.naturalHeight;
  let cx = 0.5;
  let cy = 0.4;
  let fw = 0.42;
  if (pts) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cy = (Math.min(...ys) + Math.max(...ys)) / 2 - 0.03;
    fw = Math.max(...xs) - Math.min(...xs);
  }
  const w = Math.min(1, fw * 1.7);
  const h = Math.min(1, (w * iw * 4) / 3 / ih);
  return { x: Math.min(1 - w, Math.max(0, cx - w / 2)), y: Math.min(1 - h, Math.max(0, cy - h / 2)), w, h };
}

// Where a face point lands on the board: on the painting's own face when it was found there, else the captured
// face's layout scaled into the middle of the painting.
function placer(input: ChartInput): (i: number) => Pt {
  const v = view(input);
  if (input.paintPts) return (i) => [PX + ((input.paintPts![i][0] - v.x) / v.w) * PW, PY + ((input.paintPts![i][1] - v.y) / v.h) * PH];
  const xs = input.facePts.map((p) => p[0]);
  const ys = input.facePts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fw = (PW * 0.42) / v.w;
  const fh = (fw * (y1 - y0)) / (x1 - x0);
  const [cx, cy] = [PX + ((0.5 - v.x) / v.w) * PW, PY + ((0.42 - v.y) / v.h) * PH];
  return (i) => [cx + ((input.facePts[i][0] - x0) / (x1 - x0) - 0.5) * fw, cy + ((input.facePts[i][1] - y0) / (y1 - y0) - 0.5) * fh];
}

export function drawChart(input: ChartInput): string {
  const height = input.boxes ? H : 1000;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = height;
  const g = c.getContext("2d")!;
  const serif = getComputedStyle(document.body).getPropertyValue("--font-myeongjo").trim() || "serif";
  const ink = "#2a1d14";
  const soft = "#6a5844";
  const seal = "#b23a2c";

  // The board: hanji with a double rule.
  g.fillStyle = "#f1e6cf"; // warm aged hanji, the same paper as the painting
  g.fillRect(0, 0, W, height);
  g.strokeStyle = "#8a7356";
  g.lineWidth = 3;
  g.strokeRect(18, 18, W - 36, height - 36);
  g.lineWidth = 1;
  g.strokeRect(28, 28, W - 56, height - 56);

  // Title.
  g.fillStyle = ink;
  g.textAlign = "center";
  g.font = `800 54px ${serif}`;
  g.fillText(`${input.title} 관상 도식`, W / 2, 96);
  g.fillStyle = soft;
  g.font = `600 24px ${serif}`;
  g.fillText(`(${input.hanja} 觀相圖式)`, W / 2, 134);

  // The painting, with a thin frame.
  const v = view(input);
  const iw = input.painting.naturalWidth;
  const ih = input.painting.naturalHeight;
  g.drawImage(input.painting, v.x * iw, v.y * ih, v.w * iw, v.h * ih, PX, PY, PW, PH);
  g.strokeStyle = "#8a7356";
  g.lineWidth = 2;
  g.strokeRect(PX, PY, PW, PH);

  // Notes and leader lines, spread so they never overlap.
  const at = placer(input);
  const notes = chartNotes(input.m)
    .filter((n) => !input.hidden.includes(n.anchor))
    .map((n) => ({ ...n, p: at(n.anchor) }));
  for (const side of ["L", "R"] as const) {
    const col = notes.filter((n) => n.side === side).sort((a, b) => a.p[1] - b.p[1]);
    let last = PY - 20;
    for (const n of col) {
      const y = Math.min(PY + PH - 30, Math.max(n.p[1], last + 92));
      last = y;
      const xText = side === "L" ? PX - 24 : PX + PW + 24;
      const xLine = side === "L" ? PX - 14 : PX + PW + 14;
      g.strokeStyle = ink;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(xLine, y - 8);
      g.lineTo(n.p[0], n.p[1]);
      g.stroke();
      g.fillStyle = seal;
      g.beginPath();
      g.arc(n.p[0], n.p[1], 5, 0, Math.PI * 2);
      g.fill();
      g.textAlign = side === "L" ? "right" : "left";
      g.fillStyle = ink;
      g.font = `800 25px ${serif}`;
      g.fillText(n.title, xText, y - 2, PX - 52);
      g.fillStyle = soft;
      g.font = `600 21px ${serif}`;
      g.fillText(n.note, xText, y + 28, PX - 52);
    }
  }

  // 성격 and 운세 boxes.
  const s = chartSummary(input.m);
  const box = (x: number, label: string, lines: string[]) => {
    const y = PY + PH + 34;
    const w = (W - 56 - 40 - 24) / 2;
    g.strokeStyle = "#8a7356";
    g.lineWidth = 2;
    g.strokeRect(x, y, w, 300);
    g.lineWidth = 1;
    g.strokeRect(x + 6, y + 6, w - 12, 288);
    g.textAlign = "left";
    g.fillStyle = seal;
    g.font = `800 30px ${serif}`;
    g.fillText(label, x + 28, y + 52);
    g.fillStyle = ink;
    g.font = `600 25px ${serif}`;
    lines.forEach((t, i) => g.fillText(`· ${t}`, x + 28, y + 108 + i * 54, w - 50));
  };
  if (input.boxes) {
    box(48, "성격", s.trait);
    box(48 + (W - 56 - 40 - 24) / 2 + 24, "운세", s.luck);
  }

  // Footer: the sitter's name and a small seal.
  g.textAlign = "right";
  g.fillStyle = soft;
  g.font = `600 22px ${serif}`;
  g.fillText(`${input.name} · 관상감 판정`, W - 110, height - 46);
  g.fillStyle = seal;
  g.fillRect(W - 98, height - 80, 46, 46);
  g.fillStyle = "#f6ead8";
  g.textAlign = "center";
  g.font = `800 17px ${serif}`;
  g.fillText(input.name.replace(/\s/g, "").slice(0, 2), W - 75, height - 50);
  return c.toDataURL("image/jpeg", 0.92);
}
