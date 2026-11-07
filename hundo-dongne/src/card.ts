import { File, Share } from "@apps-in-toss/web-framework";
import { josa } from "@/lib/josa";
import { MAP, proj, type Region } from "./place";

// The share cards, drawn on a canvas so they can be saved to the phone and posted (story, chat) as a picture:
// 한지 paper, the place in big seal red, the real 2026 map with the place stamped, and the 訓導 seal.
//   one  : 내 운명의 동네 1위          "너는 어디야?"
//   rank : 이 동네 성적표 (N곳 중 M위)  "너희 동네는 몇 위야?"
//   pair : 우리 둘의 동네               "너랑 나는 어디서 살까?"

const W = 1080, H = 1350;
const PAPER = "#f4ecdb", INK = "#211b17", SEAL = "#b3261e", GOLD = "#86601a", LAND = "#e6dcc4";
const FONT = '"Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", serif';

export type Card =
  | { kind: "one"; who: string; place: Region; lines: string[]; home: Region }
  | { kind: "rank"; who: string; place: Region; rank: number; of: number; lines: string[]; home: Region; shade: Map<string, string> }
  | { kind: "pair"; who: string; mate: string; place: Region; lines: string[]; homes: [Region, Region] };

const HOOK = { one: "너는 어디야?", rank: "너희 동네는 몇 위야?", pair: "너랑 나는 어디서 살까?" };
const KICK = { one: "내 사주 동네", rank: "동네 성적표", pair: "우리 둘의 동네" };

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color = INK, weight = 800) {
  c.font = `${weight} ${size}px ${FONT}`;
  c.fillStyle = color;
  c.fillText(s, x, y);
}

function spaced(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string) {
  c.font = `800 ${size}px ${FONT}`;
  c.fillStyle = color;
  let at = x;
  for (const ch of s) {
    c.fillText(ch, at, y);
    at += c.measureText(ch).width + size * 0.32;
  }
}

function map(c: CanvasRenderingContext2D, ox: number, oy: number, w: number, fill: (r: Region) => string) {
  const k = w / MAP.w;
  c.save();
  c.translate(ox, oy);
  c.scale(k, k);
  c.lineWidth = 0.8;
  c.strokeStyle = PAPER;
  for (const r of MAP.regions) {
    const p = new Path2D(r.d);
    c.fillStyle = fill(r);
    c.fill(p);
    c.stroke(p);
  }
  c.restore();
  return (r: Region) => {
    const { x, y } = proj(r);
    return { x: ox + x * k, y: oy + y * k };
  };
}

function wrap(c: CanvasRenderingContext2D, s: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && c.measureText(next).width > max) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function seal(c: CanvasRenderingContext2D, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.rotate((-5 * Math.PI) / 180);
  c.fillStyle = SEAL;
  c.beginPath();
  c.roundRect(-64, -64, 128, 128, 8);
  c.fill();
  c.fillStyle = PAPER;
  c.textAlign = "center";
  c.font = `800 46px ${FONT}`;
  c.fillText("訓", 0, -8);
  c.fillText("導", 0, 44);
  c.restore();
}

function dot(c: CanvasRenderingContext2D, p: { x: number; y: number }) {
  c.beginPath();
  c.arc(p.x, p.y, 9, 0, Math.PI * 2);
  c.fillStyle = INK;
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = PAPER;
  c.stroke();
}

export function drawCard(card: Card): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  const g = c.createRadialGradient(220, 140, 40, 220, 140, 1100);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(1, PAPER);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.textBaseline = "alphabetic";

  spaced(c, KICK[card.kind], 80, 110, 30, SEAL);
  const [sido, ...rest] = [card.place.sido, card.place.name];
  if (card.kind === "one") {
    text(c, `${card.who}님의 기운을`, 80, 200, 64);
    text(c, "채우는 동네 1위", 80, 284, 64);
  } else if (card.kind === "rank") {
    text(c, josa(`${card.place.sido} ${card.place.name}`, "은/는"), 80, 200, 60);
    text(c, `${card.who}님에게`, 80, 280, 60);
  } else {
    text(c, `${card.who} ♥ ${card.mate}`, 80, 200, 64);
    text(c, "함께 살면 좋은 곳", 80, 284, 64);
  }

  let y = 0;
  if (card.kind === "rank") {
    text(c, `${card.of}곳 중`, 80, 470, 60);
    c.font = `800 200px ${FONT}`;
    const left = 80 + c.measureText("").width;
    c.font = `800 60px ${FONT}`;
    const after = c.measureText(`${card.of}곳 중 `).width;
    text(c, String(card.rank), left + after, 480, 200, SEAL);
    c.font = `800 200px ${FONT}`;
    const nw = c.measureText(String(card.rank)).width;
    text(c, "위", left + after + nw + 16, 470, 60);
    y = 560;
  } else {
    text(c, sido, 80, 440, 116, SEAL);
    text(c, rest.join(" "), 80, 570, rest.join(" ").length > 6 ? 96 : 116, SEAL);
    y = 660;
  }
  // The reasons, wrapped to the page width, above the map (never under it).
  c.font = `400 34px ${FONT}`;
  const rows = card.lines.slice(0, 2).flatMap((l) => wrap(c, l, W - 160));
  rows.slice(0, 4).forEach((l, i) => text(c, l, 80, y + i * 52, 34, INK, 400));
  const top = Math.max(y + Math.min(rows.length, 4) * 52 + 10, 760);

  // The map, bottom right, with the place stamped.
  const mw = Math.min(480, ((1250 - top) * MAP.w) / MAP.h);
  const at = map(c, W - 50 - mw, top, mw, (r) =>
    r.code === card.place.code ? SEAL : card.kind === "rank" ? (card.shade.get(r.code) ?? LAND) : LAND,
  );
  if (card.kind === "pair") {
    const t = at(card.place);
    for (const h of card.homes) {
      const s = at(h);
      c.setLineDash([10, 8]);
      c.lineWidth = 4;
      c.strokeStyle = SEAL;
      c.beginPath();
      c.moveTo(s.x, s.y);
      c.quadraticCurveTo((s.x + t.x) / 2 + 40, (s.y + t.y) / 2, t.x, t.y);
      c.stroke();
      c.setLineDash([]);
      dot(c, s);
    }
    text(c, "♥", t.x - 18, t.y - 22, 44, SEAL);
  } else {
    dot(c, at(card.home));
    const t = at(card.place);
    if (card.kind === "one") text(c, "運", t.x + 14, t.y - 18, 44, SEAL);
  }

  text(c, HOOK[card.kind], 80, 1240, 30, INK, 400);
  text(c, "토스에서 '내 사주 동네'", 80, 1282, 30);
  seal(c, 940, 120);
  c.font = `400 22px ${FONT}`;
  c.fillStyle = GOLD;
  c.fillText(`행정구역 ${MAP.asOf.slice(0, 7).replace("-", ".")} 기준`, 80, 1322);
  return cv;
}

// Saves the card to the phone (the Toss app's file save; a download outside Toss).
export async function saveCard(card: Card, fileName: string): Promise<"saved" | "failed"> {
  const url = drawCard(card).toDataURL("image/png");
  try {
    if (File.saveBase64.isSupported()) {
      await File.saveBase64({ data: url.split(",")[1], fileName, mimeType: "image/png" });
      return "saved";
    }
  } catch {
    // Fall through to the browser's download.
  }
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    return "saved";
  } catch {
    return "failed";
  }
}

// A link back into this mini app, optionally carrying the pair token, then the share sheet with a message.
export async function shareMessage(message: string, path = "intoss://hundo-dongne"): Promise<boolean> {
  let link = "";
  try {
    link = await Share.createLink({ path });
  } catch {
    // Outside the Toss app: the message goes without a link.
  }
  try {
    await Share.sendMessage({ message: link ? `${message}\n${link}` : message });
    return true;
  } catch {
    return false; // the viewer closed the sheet
  }
}
