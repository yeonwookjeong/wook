import { iljuFacts, jiaziNo } from "./cards";
import { meetings, stemClash, stemCombine } from "./deep";
import { ELEMENT_KO, stemEl, BRANCH_EL } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "./saju";
import dogam from "./iljuDogam.json";

// 60일주 사전: one page per day pillar, written to be read (what people say about you, love, work, money, the
// moment it hurts, the moment it shines), with the reasons kept at the bottom. The words are written per pillar
// from its own reading (the stem as a person, what sits under it, its stage); the matches and the month's rank
// are computed. All sixty are open (lib/iljuDogam.json).

type Scene = { t: string; s: string };

export type IljuEntry = {
  slug: string;
  stem: number;
  branch: number;
  // The pillar in one line: what it is like, said as a person.
  hook: string;
  // 이런 말, 자주 듣지 않나요?
  heard: string[];
  // 사용설명서: the person as scenes to picture, three per part (two for how they recharge).
  basic: Scene[];
  on: Scene[];
  off: Scene[];
  approach: Scene[];
  charge: "alone" | "people";
  chargeScenes: Scene[];
  love: string;
  work: string;
  money: string;
  hurt: string;
  shine: string;
  // 정 훈도's line at the end.
  hundo: string;
  // The reading the words stand on, shown folded.
  basis: string[];
};

// The sixty, written and checked one by one (lib/iljuDogam.json, in 육십갑자 order). A pillar's stem and branch
// follow from its place: the n-th pair of the sixty is stem (n-1) mod 10 and branch (n-1) mod 12.
export const ILJU_BOOK: IljuEntry[] = (dogam as (Omit<IljuEntry, "stem" | "branch"> & { no: number })[]).map(({ no, ...e }) => ({
  ...e,
  stem: (no - 1) % 10,
  branch: (no - 1) % 12,
}));

export const iljuBySlug = (slug: string) => ILJU_BOOK.find((x) => x.slug === slug) ?? null;

// The pillar itself: name, hanja, image, its place in the sixty, and the two elements it stands on.
export function iljuHead(e: IljuEntry) {
  const f = iljuFacts(e.stem, e.branch);
  return { ...f, no: jiaziNo(e.stem, e.branch), stemEl: stemEl(e.stem), branchEl: BRANCH_EL[e.branch] };
}

export const ELEMENT_NAME = (el: number) => ELEMENT_KO[el];

// How another day pillar meets this one: the stems combining or clashing, the branches combining or clashing.
type Match = { hanja: string; name: string; score: number; plain: string; why: string };
function meet(stem: number, branch: number, s: number, b: number): Match {
  const ms = meetings(branch, b);
  const sc = stemCombine(stem, s);
  const sx = stemClash(stem, s);
  const bc = ms.includes("육합");
  const tri = ms.includes("삼합");
  const bx = ms.includes("충");
  const small = (["형", "원진", "파", "해"] as const).filter((k) => ms.includes(k));
  const score = (sc ? 2 : 0) + (bc ? 2 : 0) + (tri ? 1.5 : 0) - (sx ? 2 : 0) - (bx ? 2 : 0) - small.length;
  const plain =
    sc && bc
      ? "마음도 생활도 맞는 짝"
      : sc
        ? "마음이 잘 통하는 짝"
        : bc
          ? "생활 리듬이 잘 맞는 짝"
          : tri
            ? "같은 방향을 보는 짝"
            : sx && bx
              ? "생각도 생활도 부딪히는 사이"
              : bx
                ? "생활 리듬이 부딪히는 사이"
                : sx
                  ? "생각이 자주 부딪히는 사이"
                  : "무난한 사이";
  const why = [
    sc && `천간합(${STEMS[stem]}${STEMS[s]})`,
    sx && `천간충(${STEMS[stem]}${STEMS[s]})`,
    bc && `육합(${BRANCHES[branch]}${BRANCHES[b]})`,
    tri && `삼합(${BRANCHES[branch]}${BRANCHES[b]})`,
    bx && `충(${BRANCHES[branch]}${BRANCHES[b]})`,
    ...small.map((k) => `${k}(${BRANCHES[branch]}${BRANCHES[b]})`),
  ]
    .filter(Boolean)
    .join(" · ");
  return { hanja: `${STEMS[s]}${BRANCHES[b]}`, name: `${STEMS_KO[s]}${BRANCHES_KO[b]}`, score, plain, why };
}

// The three that meet it best (each for a different reason when there is a choice) and the two that clash most.
export function iljuMatches(stem: number, branch: number) {
  const all = Array.from({ length: 60 }, (_, i) => meet(stem, branch, i % 10, i % 12)).filter((m) => m.hanja !== `${STEMS[stem]}${BRANCHES[branch]}`);
  const good = [...all].sort((a, b) => b.score - a.score).filter((m) => m.score > 0);
  const best = good.filter((m, i) => good.findIndex((x) => x.plain === m.plain) === i).slice(0, 3);
  for (const m of good) if (best.length < 3 && !best.includes(m)) best.push(m);
  const worst = [...all].sort((a, b) => a.score - b.score).slice(0, 2);
  return { best, worst };
}
