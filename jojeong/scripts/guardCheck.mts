// The written-report guard (lib/reportGuard.ts) against sentences it must and must not catch. Run after changing
// it: npx tsx --conditions=react-server scripts/guardCheck.mts (exits 1 on a miss).
import { riskyLines } from "../lib/reportGuard";

// [product, sentence, lover (궁합), should it be caught]
const CASES: [string, string, boolean, boolean][] = [
  // 궁합
  ["gunghap", "배우자 자리끼리 충이라 부딪히기 쉬운 사이예요.", false, true],
  ["gunghap", "연애하듯 설렘이 있을 수 있어요.", false, true],
  ["gunghap", "남편과 아내처럼 끌림이 커요.", false, true],
  ["gunghap", "두 사람은 결국 헤어져요.", true, true],
  ["gunghap", "결국 갈라설 거예요.", true, true],
  ["gunghap", "두 사람은 결혼 못 한다.", true, true],
  ["gunghap", "두 사람은 결혼하기 어려워요.", true, true],
  ["gunghap", "운명의 상대예요.", true, true],
  ["gunghap", "천생연분이에요.", true, true],
  ["gunghap", "이성으로 판단하는 아버지예요.", false, false],
  ["gunghap", "천생연분은 아니지만 서로 맞춰 가요.", true, false],
  ["gunghap", "결혼 못 한다는 뜻은 아니에요.", true, false],
  ["gunghap", "충이 있다고 헤어지는 건 아니에요.", true, false],
  ["gunghap", "손발이 잘 맞아요.", false, false],
  // 그 밖의 보고서와 묻기 답
  ["ask", "이 해에 결혼하면 반드시 헤어지게 돼요.", true, true],
  ["ask", "기다리면 반드시 돌아와요.", true, true],
  ["ask", "반드시 부자가 됩니다.", true, true],
  ["ask", "두 사람 사이는 오래 못 가요.", true, true],
  ["ask", "단명할 상이에요.", true, true],
  ["ask", "이 사람과는 미래가 없어요.", true, true],
  ["ask", "돈 걱정할 미래는 없어요.", true, false],
  ["ask", "반드시 쉬어 가셔야 하옵니다.", true, false],
  ["ask", "반드시 건강검진을 받으셔야 하옵니다.", true, false],
  ["ask", "몸이 반드시 신호를 보내 옵니다.", true, false],
  ["ask", "쉬어 가시면 좋사옵니다.", true, false],
  ["ask", "걱정할 일은 없어요.", true, false],
  ["ask", "기가 죽어요.", true, false],
  ["ask", "요절복통할 만큼 웃긴 일이 생겨요.", true, false],
  ["ask", "그대는 단명할 상이 아니옵니다.", true, false],
  ["jaemul", "돈이 들어와도 오래 못 가니 모아 두세요.", true, false],
  ["yeonun", "결혼하기 어려운 사주는 없사옵니다.", true, false],
];

let misses = 0;
for (const [product, text, lover, want] of CASES) {
  const hits = riskyLines(product, text, [], lover);
  if (hits.length > 0 !== want) {
    misses++;
    console.log(`${want ? "놓침" : "오탐"}: [${product}] ${text} ${hits.join(" | ")}`);
  }
}
console.log(`${CASES.length - misses}/${CASES.length} 맞음`);
process.exit(misses ? 1 : 0);
