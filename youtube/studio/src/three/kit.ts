// 3D 장면 공용 도구: 캔버스 무늬, 고정 난수(렌더 탭마다 같은 결과), 금속 무늬
import * as THREE from "three";

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 고정 씨앗 난수: 여러 탭에서 나눠 렌더해도 무늬가 똑같아야 깜빡이지 않는다
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 헤어라인 금속(세로 결)
export function brushedTex(base: string, seed = 7) {
  const r = rng(seed);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const x = r() * 512;
      const a = 0.03 + r() * 0.07;
      g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      g.fillRect(x, 0, 0.6 + r() * 1.4, 512);
    }
  });
}

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
