"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { isAdmin, signIn, signOut } from "@/lib/admin";
import { isGiftable, originNow } from "@/lib/gift";
import { createGiftOrder, revokeGiftOrder } from "@/lib/pay";
import { encodePerson } from "@/lib/pairToken";
import { personOf } from "@/lib/personForm";
import { productById } from "@/lib/products";
import { jobFor, type JobRequest } from "@/lib/reportWriter";
import { BirthInputError } from "@/lib/saju";
import { deleteInquiry, setInquiryDone } from "@/lib/store";

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
      const order = await createGiftOrder(product.id, req, req.y ? `${person.name}님 · ${req.y}년 운세` : `${person.name}님`);
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
