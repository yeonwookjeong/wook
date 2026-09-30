import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "./brand";
import { isOpen, isPair, productById, type ProductId } from "./products";

// The address the owner is on right now (hundosaju.com, or a preview), so a link works wherever it was made.
export async function originNow(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

// The reports the owner can give away from /admin: the one-person written ones on sale. 택일 (a search) and the
// two-person reports need more than one chart, so they are not among them yet.
export const GIFTABLE: ProductId[] = ["pyeongsaeng", "jaemul", "yeonae", "jikup", "yeonun"];

export const isGiftable = (id: string): id is ProductId => {
  const p = productById(id);
  return Boolean(p && p.modern && !isOpen(p) && !isPair(p) && (GIFTABLE as string[]).includes(id));
};
