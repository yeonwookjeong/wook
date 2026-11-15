import React, { useEffect, useRef, useState } from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { BOSS2, Cast, DAD2, GRAN2, KID2, MOM2, Pose2, drawCast } from "../cas/toonkr2";

const FONT = "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif";

/** 캐릭터 한 명을 600x1000 판에 그려 큰 캔버스에 붙임 */
const put = (g: CanvasRenderingContext2D, C: Cast, P: Pose2, x: number, y: number, s: number) => {
  const c = document.createElement("canvas");
  c.width = 600; c.height = 1000;
  drawCast(c.getContext("2d")!, C, P);
  g.drawImage(c, x, y, 600 * s, 1000 * s);
};

const Sheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender());
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#f6efe2"; g.fillRect(0, 0, 1920, 1080);
    g.fillStyle = "#2a1c24"; g.font = `800 40px ${FONT}`; g.fillText("코노라마 캐릭터 2판 · 모델 시트", 60, 70);
    // 키 비교 기준선
    g.strokeStyle = "rgba(42,28,36,0.15)"; g.lineWidth = 2;
    for (let y = 120; y <= 760; y += 80) { g.beginPath(); g.moveTo(40, y); g.lineTo(1880, y); g.stroke(); }
    const cast: [Cast, string, Pose2][] = [
      [KID2, "주인공 (아이)", { face: "grin", blush: 0.4 }],
      [MOM2, "엄마", { face: "smile" }],
      [DAD2, "아빠", { face: "smile", armL: 18 }],
      [GRAN2, "할머니", { face: "smile" }],
      [BOSS2, "사장", { face: "smug" }],
    ];
    cast.forEach(([C, name, P], i) => {
      const x = 40 + i * 370;
      put(g, C, P, x, 790 - 1000 * 0.7 + 10, 0.7);
      g.fillStyle = "#2a1c24"; g.font = `700 28px ${FONT}`; g.textAlign = "center"; g.fillText(name, x + 210, 840); g.textAlign = "left";
    });
    // 표정 줄 (아이)
    const faces: Pose2[] = [{ face: "smile" }, { face: "grin", blush: 0.6 }, { face: "open", brow: 1 }, { face: "o", brow: 0.6, look: 0.8 }, { face: "sad" }, { face: "worried" }, { face: "smug" }, { blink: true, face: "flat" }];
    faces.forEach((P, i) => {
      const c = document.createElement("canvas"); c.width = 600; c.height = 1000;
      drawCast(c.getContext("2d")!, KID2, P);
      g.drawImage(c, 150, 400, 300, 280, 40 + i * 232, 870, 225, 210);
    });
    continueRender(h);
  }, [h]);
  return <canvas ref={ref} width={1920} height={1080} />;
};

export const StyleRoot: React.FC = () => (
  <>
    <Composition id="CastSheet" component={Sheet} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
