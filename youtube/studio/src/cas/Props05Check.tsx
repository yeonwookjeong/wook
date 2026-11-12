// EP05 소품 점검: 모든 카드를 빨간 점선(카드 경계)과 함께 보여준다
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import { drawAgeCard, drawBaby, drawBalloon, drawCalendar, drawFirework, drawNewspaper, drawShelf, drawSign, drawTag } from "./cards05";

const { fontFamily } = loadFont();
const F = `"${fontFamily}", Arial, sans-serif`;
type Item = { w: number; h: number; d: (g: CanvasRenderingContext2D) => void; s?: number };
const ITEMS: Item[] = [
  { w: 400, h: 400, d: (g) => drawBaby(g) },
  { w: 400, h: 400, d: (g) => drawBaby(g, true) },
  { w: 300, h: 520, d: (g) => drawBalloon(g, "1", F) },
  { w: 300, h: 520, d: (g) => drawBalloon(g, "2", F, "#ffb02e") },
  { w: 400, h: 480, d: (g) => drawCalendar(g, "DEC", "31", F) },
  { w: 400, h: 480, d: (g) => drawCalendar(g, "JAN", "1", F, true) },
  { w: 400, h: 400, d: (g) => drawFirework(g) },
  { w: 360, h: 440, d: (g) => drawAgeCard(g, "KOREAN AGE", "28", "#e2343a", F) },
  { w: 360, h: 440, d: (g) => drawAgeCard(g, "YEAR AGE", "27", "#3b6fb6", F) },
  { w: 360, h: 440, d: (g) => drawAgeCard(g, "INTERNATIONAL", "26", "#3f9a6a", F) },
  { w: 600, h: 440, d: (g) => drawNewspaper(g, "NEW AGE LAW", "JUNE 28, 2023", F) },
  { w: 220, h: 200, d: (g) => drawTag(g, "28", F) },
  { w: 640, h: 180, d: (g) => drawSign(g, "MILITARY", "#3f5a3a", F) },
  { w: 600, h: 420, d: (g) => drawShelf(g) },
];
const Cv: React.FC<{ it: Item }> = ({ it }) => {
  const r = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { it.d(r.current!.getContext("2d")!); }, [it]);
  return <canvas ref={r} width={it.w} height={it.h} style={{ width: it.w * 0.55, height: it.h * 0.55, outline: "3px dashed red", background: "#eadfca" }} />;
};
export const Props05Check: React.FC = () => (
  <AbsoluteFill style={{ background: "#f4ead8", flexWrap: "wrap", flexDirection: "row", gap: 24, padding: 30, alignContent: "flex-start" }}>
    {ITEMS.map((it, k) => <Cv key={k} it={it} />)}
  </AbsoluteFill>
);
