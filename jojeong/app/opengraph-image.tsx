import { storeImage } from "@/lib/og";

export const alt = "관상감 정 훈도 · 조선 최고의 사주쟁이가 읽어 주는 내 사주";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return storeImage();
}
