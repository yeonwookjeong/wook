import { sinsalImage } from "@/lib/og";

export const alt = "무료 신살 테스트, 그대 사주에 숨은 살 이름";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return sinsalImage();
}
