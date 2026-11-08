// 고민별 질문 (2026-11-06 대표님 시안 지시): a 질문 sold as the worry it answers, not as "질문권". Each card opens
// the ask page with its question already written (app/ask/DraftCarry.tsx keeps it through signing in).
export type Worry = { id: string; title: string; line: string; draft: string };

export const WORRIES: Worry[] = [
  {
    id: "job",
    title: "이직해도 될까",
    line: "옮길 때인지, 버틸 때인지",
    draft: "지금 회사를 그만두고 옮겨도 될까요? 옮긴다면 언제쯤이 좋을지도 알고 싶어요.",
  },
  {
    id: "contact",
    title: "먼저 연락해도 될까",
    line: "연락이 끊긴 그 사람에게",
    draft: "연락이 끊긴 사람에게 제가 먼저 연락해도 될까요? 한다면 언제가 좋을까요?",
  },
  {
    id: "stay",
    title: "이 사람, 계속 만나도 될까",
    line: "지금 만나는 사람과의 앞날",
    draft: "지금 만나는 사람과 계속 만나도 괜찮을까요? 제가 조심해야 할 점도 알고 싶어요.",
  },
  {
    id: "contract",
    title: "계약해도 될까",
    line: "집, 일, 돈이 걸린 도장 앞에서",
    draft: "이번 계약을 해도 될까요? 서두르지 말아야 할 부분이 있는지 알고 싶어요.",
  },
  {
    id: "move",
    title: "이사, 지금일까",
    line: "올해 옮길지, 한 해 더 볼지",
    draft: "올해 이사하려고 하는데, 지금이 맞는 때일까요? 미루는 게 나을까요?",
  },
];

export const worryHref = (w: Worry) => `/ask?draft=${encodeURIComponent(w.draft)}`;
