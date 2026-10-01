"use server";

import { addInquiry } from "@/lib/store";
import { INQUIRY_TOPICS } from "./topics";

export type InquiryState = { status: "idle" | "sent" | "error"; message: string | null };

// Junk the inbox keeps getting: "list your site in Google's index" and the like, in English, with a link, often
// from an address dressed up as ours (…@search-hundosaju.com). Readers write in Korean.
const SPAM_WORDS = /\b(seo|index(ing)?|backlinks?|search (engine|results?|index)|submit|traffic|rank(ing)?|crypto|casino|loan|whatsapp|telegram)\b/i;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|pro|io|xyz|info|biz|top|site|online|co)\b)/i;
function isSpam(body: string, email: string) {
  const korean = /[가-힣]/.test(body);
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain.includes("hundosaju") && domain !== "hundosaju.com") return true;
  if (!korean && (LINK.test(body) || SPAM_WORDS.test(body))) return true;
  if (LINK.test(body) && SPAM_WORDS.test(body) && (body.match(/[가-힣]/g)?.length ?? 0) < 20) return true;
  return false;
}

// A question from the contact page, kept for the owner's inbox. The hidden "website" field is a trap for bots:
// people never fill it. Junk (above) gets the same "sent" a person sees, so nothing tells a bot to try again,
// and is not kept.
export async function sendInquiryAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  if (String(formData.get("website") ?? "")) return { status: "sent", message: null };
  const topic = String(formData.get("topic") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (isSpam(body, email)) return { status: "sent", message: null };
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
