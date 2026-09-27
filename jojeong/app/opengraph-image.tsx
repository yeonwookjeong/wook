import { storeImage } from "@/lib/og";

export const alt = "훈도사주 · 누구에게나 맞는 말 말고, 나한테만 맞는 말";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return storeImage();
}
