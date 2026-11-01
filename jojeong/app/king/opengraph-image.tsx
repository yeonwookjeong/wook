import { landingImage } from "@/lib/og";

export const alt = "어명이오, 내가 왕이라면 너는 어떤 신하일까";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return landingImage();
}
