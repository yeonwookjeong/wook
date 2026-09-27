import { storeImage } from "@/lib/og";

export const alt = "관상감 정 훈도 · 누구에게나 맞는 말은 하지 않는 사주";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return storeImage();
}
