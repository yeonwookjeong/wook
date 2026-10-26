"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { isAdmin, setPreview, signIn, signOut } from "@/lib/admin";
import { isGiftable, originNow } from "@/lib/gift";
import { createGiftOrder, getOrder, giveBonus, markTestOrder, revokeGiftOrder, rewriteReport } from "@/lib/pay";
import { pricingNow } from "@/lib/pricing";
import { addOrderToMember, changeCredits, getMember } from "@/lib/members";
import { encodePerson } from "@/lib/pairToken";
import { personOf } from "@/lib/personForm";
import { productById } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";
import { BirthInputError } from "@/lib/saju";
import { deleteInquiry, setInquiryDone } from "@/lib/store";
import { createCreditEvent, setCreditEventOn } from "@/lib/creditEvents";

export async function adminSignIn(_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  if (!(await signIn(String(formData.get("password") ?? "")))) return { error: "비밀번호가 맞지 않아요." };
  redirect("/admin");
}

export async function adminSignOut() {
  await signOut();
  redirect("/");
}

// The inbox: mark a question answered (or open again), or delete it. Owner only.
export async function inquiryDoneAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await setInquiryDone(String(formData.get("id") ?? ""), formData.get("done") === "1");
  refresh();
}

export async function inquiryDeleteAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await deleteInquiry(String(formData.get("id") ?? ""));
  refresh();
}

// ── Reports given away: a friend's chart and the reports to open, each made into a link (/r/…) that opens on
// any device. Owner only; the orders are paid at 0 won and stay out of the sales (lib/pay.ts createGiftOrder).
export type GiftState = { error: string | null; name?: string; links?: { title: string; url: string }[] };

export async function giftIssueAction(_prev: GiftState, formData: FormData): Promise<GiftState> {
  if (!(await isAdmin())) return { error: "관리자로 다시 로그인해 주세요." };
  const ids = [...new Set(formData.getAll("product").map(String))].filter(isGiftable);
  if (ids.length === 0) return { error: "보고서를 하나 이상 골라 주세요." };
  const y = String(formData.get("y") ?? "");
  try {
    const person = await personOf(formData, "", "친구");
    const p = encodePerson(person);
    const reqs = ids.map((id): JobRequest => ({ product: id, p, ...(id === "yeonun" && { y }) }));
    // Everything is checked before anything is made, so a bad year never leaves half a set of links.
    for (const req of reqs) {
      const job = await jobFor(req);
      if ("error" in job) return { error: `${productById(req.product)?.title}: ${job.error}` };
    }
    const origin = await originNow();
    const links: { title: string; url: string }[] = [];
    for (const req of reqs) {
      const product = productById(req.product)!;
      // A gift made in the opened shop (or 시안 모드) is the new version, like what is bought there.
      const order = await createGiftOrder(product.id, req, req.y ? `${person.name}님 · ${req.y}년 운세` : `${person.name}님`, (await pricingNow()) === "a" ? "a" : undefined);
      links.push({ title: req.y ? `${product.title} ${req.y}년` : product.title, url: `${origin}/r/${order.id}` });
    }
    refresh();
    return { error: null, name: person.name, links };
  } catch (e) {
    if (e instanceof BirthInputError) return { error: e.message.replace(/^친구: /, "") };
    console.error(e);
    return { error: "링크를 만들다 문제가 생겼어요. 잠시 후 다시 시도해 주세요." };
  }
}

// A gift closed again: its link then leads to the shopper's own list instead of the report.
export async function giftRevokeAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await revokeGiftOrder(String(formData.get("id") ?? ""));
  refresh();
}

// 시안 모드 on or off for this browser (app/admin/free-preview). Owner only.
export async function previewModeAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await setPreview(formData.get("on") === "1");
  refresh();
}

// A paid order marked as a test payment, or back as a real one (the dashboard leaves tests out). Owner only.
export async function testOrderAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await markTestOrder(String(formData.get("id") ?? ""), formData.get("test") === "1");
  refresh();
}

// A bought report written again under today's reading (a 👎 put right, 2026-10-26 대표님 결재): the next opening
// writes it anew; the buyer keeps the same link. Owner only, and only when asked twice (the box must be ticked).
export async function rewriteReportAction(formData: FormData) {
  if (!(await isAdmin()) || formData.get("sure") !== "1") return;
  const product = productById(String(formData.get("product") ?? ""));
  if (!product) return;
  await rewriteReport(String(formData.get("order") ?? ""), product.id);
  refresh();
}

// Members (lib/members.ts), for questions by email: put a paid order on someone's account (a report bought on a
// lost phone), or add or take questions (a goodwill question, a refund done by hand). Owner only.
export async function memberFixAction(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get("member") ?? "").trim();
  if (!(await getMember(id))) return;
  const orderId = String(formData.get("order") ?? "").trim();
  const order = orderId ? await getOrder(orderId) : null;
  // The questions that came with it go in with it, once (never again at a later sign-in on the first phone).
  if (order?.status === "paid") {
    await addOrderToMember(id, orderId);
    await giveBonus(order, id);
  }
  const d = Math.trunc(Number(formData.get("credits") ?? 0));
  if (d && Math.abs(d) <= 50) await changeCredits(id, d, "관리자 조정");
  refresh();
}

// 질문권 events (lib/creditEvents.ts): a new one with its link, or one turned off and on again. Owner only.
export async function creditEventCreateAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await createCreditEvent(String(formData.get("name") ?? ""), Number(formData.get("credits")), Number(formData.get("max")), Number(formData.get("days")));
  refresh();
}
export async function creditEventToggleAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await setCreditEventOn(String(formData.get("code") ?? ""), formData.get("on") === "1");
  refresh();
}
