import { BRANCH_EL, stemEl } from "@/lib/myeongri";
import { BRANCHES, STEMS } from "@/lib/saju";
import { Cell } from "./SajuChart";

// The sample chart of the columns (壬子 戊午 丙子 己卯), each cell numbered in reading order: the year column on
// the right is read first, the hour column on the left last, top before bottom.
const COLS = [
  { pos: "시주", role: "자녀·말년", stem: 8, branch: 0, n: [7, 8] },
  { pos: "일주", role: "나·배우자", stem: 4, branch: 6, n: [5, 6] },
  { pos: "월주", role: "부모·일터", stem: 2, branch: 0, n: [3, 4] },
  { pos: "연주", role: "뿌리·어린 시절", stem: 5, branch: 3, n: [1, 2] },
];
const NUM = "①②③④⑤⑥⑦⑧";

const Badge = ({ n }: { n: number }) => (
  <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-seal text-[11px] font-extrabold text-hanji ring-2 ring-hanji">
    {NUM[n - 1]}
  </span>
);

export default function EightCells() {
  return (
    <figure className="doc-paper my-4 px-4 py-4">
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {COLS.map((c) => (
          <div key={c.pos} className="flex flex-col gap-1">
            <span className="text-[11px] font-bold">{c.pos}</span>
            <span className="text-[10px] leading-tight text-ink-soft">{c.role}</span>
            <div className="relative">
              <Cell value={STEMS[c.stem]} el={stemEl(c.stem)} />
              <Badge n={c.n[0]} />
            </div>
            <span className="text-[10px] font-bold text-ink-soft">{c.pos === "일주" ? "나" : "\u00a0"}</span>
            <div className="relative">
              <Cell value={BRANCHES[c.branch]} el={BRANCH_EL[c.branch]} />
              <Badge n={c.n[1]} />
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-center text-[11px] text-ink-soft">예시 사주표 · 번호는 읽는 순서 (오른쪽 연주부터)</figcaption>
    </figure>
  );
}
