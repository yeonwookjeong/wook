// 날개·바구니 그림 점검용
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { drawBasket, drawChar, drawWing, HIM } from "./toonkr";

export const WingCheck: React.FC = () => {
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  const c = useRef<HTMLCanvasElement>(null);
  const d = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    drawWing(a.current!.getContext("2d")!, 800, 600);
    drawBasket(b.current!.getContext("2d")!);
    drawChar(c.current!.getContext("2d")!, HIM, { legs: "fly", armL: 120, armR: 120, wings: 1, flap: Math.PI / 2, mouth: "smug" });
    drawChar(d.current!.getContext("2d")!, HIM, { legs: "fly", armL: 120, armR: 120, wings: 1, flap: -Math.PI / 2, mouth: "smug" });
  }, []);
  return (
    <AbsoluteFill style={{ background: "#f4ead8", alignItems: "center", justifyContent: "center", gap: 40, flexDirection: "column" }}>
      <canvas ref={a} width={800} height={600} style={{ outline: "4px dashed red", width: 400, height: 300 }} />
      <canvas ref={b} width={600} height={400} style={{ outline: "4px dashed red" }} />
      <div style={{ display: "flex", gap: 30 }}>
        <canvas ref={c} width={600} height={1000} style={{ outline: "4px dashed red", width: 300, height: 500 }} />
        <canvas ref={d} width={600} height={1000} style={{ outline: "4px dashed red", width: 300, height: 500 }} />
      </div>
    </AbsoluteFill>
  );
};
