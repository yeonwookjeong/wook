import "server-only";
import { covers, getOrder } from "./pay";
import { productById, type ProductId } from "./products";
import { feedbackKeys, getFeedbackRaw, getFeedbacksRaw, setFeedbackRaw } from "./store";

// How a bought report was liked: a thumb, an optional line, and whether it may be shown as a review (no name,
// only with that tick). Kept per order and report; the order id is the buyer's own link, so only they reach it.
export type Feedback = { order: string; product: ProductId; up: boolean; text: string; share: boolean; at: number; member?: string };
export const FEEDBACK_MAX = 300;

const keyOf = (order: string, product: string) => `${order}:${product}`;
const parse = (raw: string | null): Feedback | null => {
  try {
    return raw ? (JSON.parse(raw) as Feedback) : null;
  } catch {
    return null;
  }
};

export async function getFeedback(order: string, product: string): Promise<Feedback | null> {
  return parse(await getFeedbackRaw(keyOf(order, product)).catch(() => null));
}

export async function saveFeedback(f: Omit<Feedback, "at">): Promise<boolean> {
  const order = await getOrder(f.order);
  if (!order || !productById(f.product) || !covers(order, f.product)) return false;
  const before = await getFeedback(f.order, f.product);
  await setFeedbackRaw(keyOf(f.order, f.product), JSON.stringify({ ...f, text: f.text.trim().slice(0, FEEDBACK_MAX), at: Date.now() }), !before);
  return true;
}

// Newest first, for the owner.
export async function listFeedback(limit = 200): Promise<Feedback[]> {
  const keys = [...new Set((await feedbackKeys().catch(() => [])).slice(-limit))].reverse();
  return (await getFeedbacksRaw(keys).catch(() => [])).flatMap((r) => parse(r) ?? []);
}
