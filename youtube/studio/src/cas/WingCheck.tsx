// 날개·바구니 그림 점검용
import { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { drawBasket, drawWing } from "./toonkr";

export const WingCheck: React.FC = () => {
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    drawWing(a.current!.getContext("2d")!, 800, 600);
    drawBasket(b.current!.getContext("2d")!);
  }, []);
  return (
    <AbsoluteFill style={{ background: "#f4ead8", alignItems: "center", justifyContent: "center", gap: 40, flexDirection: "column" }}>
      <canvas ref={a} width={800} height={600} />
      <canvas ref={b} width={600} height={400} />
    </AbsoluteFill>
  );
};
