"use server";

import { refresh } from "next/cache";
import { saveFeedback } from "@/lib/feedback";
import { currentMemberId } from "@/lib/members";
import type { ProductId } from "@/lib/products";

// The thumb and line under a bought report (components/ReportFeedback.tsx).
export async function feedbackAction(formData: FormData) {
  const order = String(formData.get("order") ?? "");
  const product = String(formData.get("product") ?? "") as ProductId;
  if (!/^[\w-]{6,64}$/.test(order)) return;
  await saveFeedback({
    order,
    product,
    up: formData.get("up") === "1",
    text: String(formData.get("text") ?? ""),
    share: formData.get("share") === "1",
    member: (await currentMemberId()) ?? undefined,
  }).catch(() => false);
  refresh();
}
