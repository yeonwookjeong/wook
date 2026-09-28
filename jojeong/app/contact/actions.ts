"use server";

import { addInquiry } from "@/lib/store";
import { INQUIRY_TOPICS } from "./topics";

export type InquiryState = { status: "idle" | "sent" | "error"; message: string | null };

// A question from the contact page, kept for the owner's inbox. The hidden "website" field is a trap for bots:
// people never fill it.
export async function sendInquiryAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  if (String(formData.get("website") ?? "")) return { status: "sent", message: null };
  const topic = String(formData.get("topic") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!INQUIRY_TOPICS.some((t) => t.key === topic)) return { status: "error", message: "문의 종류를 골라 주세요." };
  if (body.length < 5) return { status: "error", message: "내용을 조금 더 적어 주세요." };
  if (body.length > 2000) return { status: "error", message: "내용은 2,000자까지 적을 수 있어요." };
  if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    return { status: "error", message: "답장받을 이메일 주소를 다시 확인해 주세요." };
  try {
    if ((await addInquiry(topic, body, email)) === "busy")
      return { status: "error", message: "오늘은 문의가 너무 많아요. 잠시 뒤 다시 보내거나 메일로 보내 주세요." };
  } catch {
    return { status: "error", message: "보내지 못했어요. 잠시 뒤 다시 보내거나 메일로 보내 주세요." };
  }
  return { status: "sent", message: null };
}
