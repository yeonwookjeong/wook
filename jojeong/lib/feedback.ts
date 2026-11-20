import "server-only";
import { changeCredits } from "./members";
import { covers, getOrder } from "./pay";
import { productById, type ProductId } from "./products";
import { deleteFeedbackRaw, feedbackKeys, getFeedbackRaw, getFeedbacksRaw, getHomeReviewKeys, setFeedbackRaw, setHomeReviewKeys } from "./store";

// How a bought report was liked: what the buyer liked, and whether it may be shown as a review (no name, only with
// that tick). Kept per order and report; the order id is the buyer's own link, so only they reach it. Since
// 2026-10-28 only liking is asked (a complaint goes to 문의하기), and a line of REWARD_MIN letters or more brings one
// question for 정 훈도 (`rewarded`: given, to `member`), once per bought order. `up` false: an old 👎, kept from
// buyers' eyes.
export type Feedback = { order: string; product: ProductId; up: boolean; text: string; share: boolean; at: number; member?: string; rewarded?: boolean };
import { FEEDBACK_MAX, rewardLength } from "./feedbackLimits";
export { FEEDBACK_MAX, rewardLength };
export const REWARD_MIN = 30;

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

// What the buyer sees of their own: an old 👎 is as if nothing was left, so the new box asks again.
export async function shownFeedback(order: string, product: string): Promise<Feedback | null> {
  const f = await getFeedback(order, product);
  return f?.up ? f : null;
}

export async function saveFeedback(f: Omit<Feedback, "at" | "rewarded">): Promise<boolean> {
  const order = await getOrder(f.order);
  if (!order || !productById(f.product) || !covers(order, f.product)) return false;
  const before = await getFeedback(f.order, f.product);
  const text = f.text.trim().slice(0, FEEDBACK_MAX);
  // One question per bought order (not a gift or a test), to a signed-in member, for a line long enough; kept once
  // given, whatever is written later. A refund takes it back (lib/pay.ts syncPayment).
  let rewarded = Boolean(before?.rewarded);
  if (!rewarded && f.member && order.status === "paid" && !order.gift && !order.test && order.amount > 0 && rewardLength(text) >= REWARD_MIN)
    rewarded = (await changeCredits(f.member, 1, `후기 ${order.id}`)) !== null;
  await setFeedbackRaw(keyOf(f.order, f.product), JSON.stringify({ ...f, member: rewarded ? (before?.rewarded ? before.member : f.member) : f.member, text, rewarded, at: Date.now() }), !before);
  return true;
}

// The old 👎 records, removed for good (2026-10-28 대표님); the owner's button on the admin page.
export async function deleteDownFeedback(): Promise<number> {
  const all = await listFeedback(5000);
  const down = all.filter((f) => !f.up);
  for (const f of down) await deleteFeedbackRaw(keyOf(f.order, f.product));
  return down.length;
}

// Newest first, for the owner.
export async function listFeedback(limit = 200): Promise<Feedback[]> {
  const keys = [...new Set((await feedbackKeys().catch(() => [])).slice(-limit))].reverse();
  return (await getFeedbacksRaw(keys).catch(() => [])).flatMap((r) => parse(r) ?? []);
}

// The home page's reviews (대표님 11/20: 골라서 메인 맨 아래에 돌아가며): only one the buyer allowed to be shown, liked,
// with words. No name or order; a review that brought a question says so (대가를 받은 후기 표시).
export type HomeReview = { text: string; product: string; rewarded: boolean };
export const reviewKey = keyOf;
export async function homeReviews(): Promise<HomeReview[]> {
  const keys = await getHomeReviewKeys();
  const raws = await getFeedbacksRaw(keys).catch(() => []);
  return raws.flatMap((r) => {
    const f = parse(r);
    if (!f || !f.share || !f.up || !f.text.trim()) return [];
    return [{ text: f.text.trim(), product: productById(f.product)?.title ?? "", rewarded: Boolean(f.rewarded) }];
  });
}
export async function toggleHomeReview(key: string): Promise<void> {
  const keys = await getHomeReviewKeys();
  if (keys.includes(key)) return setHomeReviewKeys(keys.filter((k) => k !== key));
  const [r] = await getFeedbacksRaw([key]);
  const f = parse(r ?? null);
  if (!f || !f.share || !f.up || !f.text.trim()) return;
  await setHomeReviewKeys([...keys, key]);
}
