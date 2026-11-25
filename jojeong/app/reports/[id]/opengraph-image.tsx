import { gukjeongImage, storeImage, yeonunImage } from "@/lib/og";
import { newYearOf, thisYear, yearName } from "@/lib/yeonun";

export const alt = "훈도사주 보고서";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link card of a report page: its own card for 신년운세 and the free reading, the shop card for the rest.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "yeonun") {
    const y = newYearOf() ?? thisYear();
    return yeonunImage(`${y} ${yearName(y).ko} 신년운세`);
  }
  if (id === "gukjeong") return gukjeongImage();
  return storeImage();
}
