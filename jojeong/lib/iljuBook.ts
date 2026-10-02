import { iljuFacts, jiaziNo } from "./cards";
import { meetings, stemClash, stemCombine } from "./deep";
import { ELEMENT_KO, stemEl, BRANCH_EL } from "./myeongri";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "./saju";

// 60일주 사전: one page per day pillar, written to be read (what people say about you, love, work, money, the
// moment it hurts, the moment it shines), with the reasons kept at the bottom. The words are written per pillar
// from its own reading (the stem as a person, what sits under it, its stage); the matches and the month's rank
// are computed. Pages open one by one as they are written and checked.

export type IljuEntry = {
  slug: string;
  stem: number;
  branch: number;
  // 이런 말, 자주 듣지 않나요?
  heard: string[];
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

export const ILJU_BOOK: IljuEntry[] = [
  {
    slug: "sinmyo",
    stem: 7,
    branch: 3,
    heard: [
      "“깔끔하다”와 “까다롭다”를 같이 들어요. 기준이 높을 뿐인데요.",
      "괜찮은 척 넘겼는데, 사실 그 말 아직 기억하고 있어요.",
      "필요한 걸 찾아내는 눈이 빨라요. 쇼핑도, 기회도.",
    ],
    love: "나를 알아봐 주는 사람에게 약해요. 대신 한번 실망하면 말없이 마음의 문을 닫아요.",
    work: "남들이 못 본 숫자 하나, 마감 직전 오타 하나를 잡아내요. 정확함이 무기가 되는 일에서 빛나요.",
    money: "아무거나 사지 않아요. 그런데 ‘이건 진짜다’ 싶으면 망설임 없이 써요.",
    hurt: "공들여 다듬은 걸 대충 보고 넘길 때.",
    shine: "흩어진 걸 딱 맞게 정리해 놓았을 때. 풀밭 속 보석처럼 눈에 띄어요.",
    hundo: "풀밭에 떨어진 보석은 알아보는 이가 임자이옵니다. 그대를 알아보는 이 곁에 머무시옵소서.",
    basis: [
      "辛(신): 다듬어진 쇠, 보석. 섬세하고 기준이 높으며 자존심이 힘이 되는 일간이에요.",
      "卯(묘): 봄 풀, 토끼. 辛에게 卯 속 乙은 편재(내가 다스리는 재물)라, 현실 감각과 기회를 잡는 눈이 있어요.",
      "십이운성 절(絶): 끊고 새로 잇는 자리라 결단이 빠르고, 인생의 전환이 여러 번 와요.",
    ],
  },
];

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
