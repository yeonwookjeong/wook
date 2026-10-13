import type { Member } from "./members";
import type { Order } from "./pay";
import { inPeriods, type Period } from "./stats";

// Where questions for 정 훈도 came from and where they went, read from each member's credit log (lib/members.ts
// changeCredits, the reason it was written with). The log keeps a member's last 50 changes, plenty for now.
export const CREDIT_KINDS = [
  { key: "join", label: "카카오 가입 선물", give: true },
  { key: "channel", label: "채널 추가 선물", give: true },
  { key: "bundle", label: "보고서에 딸린 질문", give: true },
  { key: "buy", label: "질문권 결제", give: true },
  { key: "event", label: "이벤트", give: true },
  { key: "admin", label: "관리자 지급·회수", give: true },
  { key: "use", label: "질문으로 씀", give: false },
  { key: "refund", label: "환불로 회수", give: false },
] as const;
export type CreditKind = (typeof CREDIT_KINDS)[number]["key"];

export function kindOf(why: string): CreditKind | null {
  if (why === "가입 선물") return "join";
  if (why === "채널 추가 선물") return "channel";
  if (why.startsWith("동봉")) return "bundle";
  if (why.startsWith("구매")) return "buy";
  if (why.startsWith("이벤트")) return "event";
  if (why.startsWith("관리자")) return "admin";
  if (why.startsWith("질문")) return "use";
  if (why.startsWith("환불")) return "refund";
  return null;
}

export type Ledger = Record<CreditKind, { times: number; credits: number }>;

export function ledgerOf(members: Member[], period: Period): Ledger {
  const out = Object.fromEntries(CREDIT_KINDS.map((k) => [k.key, { times: 0, credits: 0 }])) as Ledger;
  for (const m of members)
    for (const l of m.log) {
      const k = kindOf(l.why);
      if (!k || !inPeriods(l.at).includes(period)) continue;
      out[k].times += 1;
      out[k].credits += l.d;
    }
  return out;
}

// Paid reports whose questions have not reached anyone yet: bought without signing in, waiting for the buyer to
// sign in on that browser.
export const waitingBonus = (orders: Order[]) => orders.filter((o) => o.status === "paid" && !o.test && (o.bonus ?? 0) > 0 && !o.bonusGiven);
