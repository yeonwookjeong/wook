import type { Metadata } from "next";
import RoadCheck from "./RoadCheck";

export const metadata: Metadata = { title: "들어온 길 확인", robots: { index: false, follow: false } };

// For the owner: open this address from an app (스레드 프로필 링크 등) to see what the site can tell about where the
// visit came from. Shows only this browser's own details back to it; nothing is sent or stored.
export default function RoadPage() {
  return <RoadCheck />;
}
