import { josa } from "./josa";
import { TAG_ORDER, type TagKind } from "./hopae";

// The plain half of the 호패함 (lib/hopaeBox.ts keeps the server half): how rare each tag is and the line on two
// people's tags. No node modules, so a client screen (the home notice) can use it too.

// How many in 100 carry each tag: every birth 1900–2020 through lib/sinbun.ts (2026-11-19).
export const IN100: Record<TagKind, number> = { 아패: 7, 각패: 31, 황양목패: 13, 소목방패: 47, 대목방패: 3 };
// Rare enough to make a fuss over when a friend's lands in the box.
export const RARE: TagKind[] = ["아패", "대목방패"];

const was = (name: string) => josa(name, "이었다/였다").replace(/다$/, "사옵니다");

// The two of them in 조선, by their tags. `a` is the higher tag (TAG_ORDER), `b` the lower; the lower always gets the
// last word, so a 노비 tag is never the butt of it.
const LINES: Record<string, (a: string, b: string) => string> = {
  "아패|아패": (a, b) => `${josa(a, "과/와")} ${b}, 조정 같은 줄에 서서 서로 눈치만 보던 두 대감이옵니다`,
  "아패|각패": (a, b) => `${a} 대감이 일을 던지면 ${josa(b, "이/가")} 밤새 붙들고 있었사옵니다`,
  "아패|황양목패": (a, b) => `${a} 대감이 시 한 수 청하러 사랑방에 부르던 선비가 ${was(b)}`,
  "아패|소목방패": (a, b) => `${a} 대감 행차엔 ${josa(b, "이/가")} 길을 비켰으나, 대감 단골 국밥집 주인이 ${was(b)}`,
  "아패|대목방패": (a, b) => `${a} 대감댁 살림을 다 아는 단 한 사람이 ${b}, 대감도 ${b} 눈치는 봤사옵니다`,
  "각패|각패": () => "같은 관청에서 나란히 앉아 퇴청 시각만 기다리던 동료이옵니다",
  "각패|황양목패": (a, b) => `과거에 먼저 붙은 ${josa(a, "이/가")} ${b}에게 답안 요령을 몰래 일러 주었사옵니다`,
  "각패|소목방패": () => "관아 문 안팎에서 하루에도 몇 번씩 마주치던 사이이옵니다",
  "각패|대목방패": (a, b) => `관아 심부름은 모두 ${b} 손을 거쳤으니, ${a}의 일은 반이 ${b} 덕이었사옵니다`,
  "황양목패|황양목패": () => "성균관 한 방에서 밤새 글 읽다 같이 졸던 동무이옵니다",
  "황양목패|소목방패": (a, b) => `${josa(a, "이/가")} 과거 보러 한양 갈 때 노잣돈을 보태 준 이가 ${was(b)}`,
  "황양목패|대목방패": (a, b) => `${a} 선비의 책 보따리를 ${josa(b, "이/가")} 들었으나, 글은 ${josa(b, "이/가")} 더 빨리 깨쳤사옵니다`,
  "소목방패|소목방패": () => "장터 국밥집에서 막걸리 한 사발 나누던 사이이옵니다",
  "소목방패|대목방패": () => "장날마다 만나 세상 소문을 제일 먼저 주고받던 사이이옵니다",
  "대목방패|대목방패": () => "한 집에서 일하며 주인 흉을 같이 보던 단짝이옵니다",
};

export function pairLine(x: { name: string; kind: TagKind }, y: { name: string; kind: TagKind }): string {
  const [a, b] = TAG_ORDER.indexOf(x.kind) <= TAG_ORDER.indexOf(y.kind) ? [x, y] : [y, x];
  return LINES[`${a.kind}|${b.kind}`](a.name, b.name);
}
