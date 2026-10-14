import { stageOf } from "@/lib/deep";
import { ELEMENT_HANJA, ELEMENT_KO, BRANCH_EL, HIDDEN, stemEl, tenGod, type Slot } from "@/lib/myeongri";
import { BRANCHES, STEMS, hanjaKo } from "@/lib/saju";

// Element colours follow the traditional 오방색 loosely: 木 green, 火 red, 土 ochre, 金 grey-white, 水 black-blue.
export const EL_STYLE = [
  "bg-[#3d6656] text-white",
  "bg-seal text-white",
  "bg-gold text-white",
  "bg-[#d9d4c7] text-ink",
  "bg-[#1f3448] text-white",
];
const EL_BAR = ["bg-[#3d6656]", "bg-seal", "bg-gold", "bg-[#bdb6a6]", "bg-[#1f3448]"];

// What a kingdom lacks when an element is missing from the king's chart.
const MISSING_LINE = [
  "나무(木)가 없어 새 일을 벌이는 이가 드문 나라",
  "불(火)이 없어 잔치 소리가 끊긴 조용한 나라",
  "흙(土)이 없어 백성이 한곳에 뿌리내리지 못한 나라",
  "쇠(金)가 없어 결단이 늘 한 박자 늦은 나라",
  "물(水)이 없어 지혜로운 신하가 귀한 나라",
];

export function Cell({ value, el, blank = "?" }: { value: string | null; el: number | null; blank?: string }) {
  if (value === null || el === null) {
    return <div className={`flex aspect-square items-center justify-center rounded-lg border border-dashed border-ink/20 text-ink-soft ${blank.length > 1 ? "text-[11px]" : ""}`}>{blank}</div>;
  }
  return (
    <div className={`flex aspect-square flex-col items-center justify-center rounded-lg ${EL_STYLE[el]}`}>
      <span className="font-myeongjo text-xl leading-none font-extrabold">{value}</span>
      {/* How it is read, then its element: 경 · 금. */}
      <span className="mt-0.5 text-[10px] leading-none opacity-80">
        {hanjaKo(value)} · {ELEMENT_KO[el]}
      </span>
    </div>
  );
}

export default function SajuChart({
  slots,
  elements,
  strength,
  yong,
  missing,
  gyeok,
  kingdom = true,
  weights,
}: {
  slots: Slot[];
  elements: number[];
  strength: string;
  yong: number;
  missing: number[];
  gyeok?: string;
  kingdom?: boolean; // read missing elements as what the king's realm lacks
  // The elements as weighed (lib/myeongri.ts: each seat its own weight, the season, the 합), shown as shares
  // instead of the bare count of characters; the count stays beside it.
  weights?: number[];
}) {
  const wsum = weights ? weights.reduce((a, b) => a + b, 0) || 1 : 0;
  const shares = weights ? weights.map((w) => Math.round((w / wsum) * 100)) : null;
  const bars = shares ?? elements;
  const max = Math.max(...bars, 1);
  const day = slots.find((s) => s.pos === "일")!.stem!;
  return (
    <div className="mt-4 border border-seal/25 px-4 py-3">
      <p className="text-xs font-extrabold text-ink-soft">사주 원국 · 여덟 글자</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
        {slots.map((s) => (
          <div key={s.pos} className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">{s.pos}주</span>
            {/* 십신 over the stem, then the branch with its 십신, hidden stems (지장간) and life stage (12운성) */}
            <span className="text-[10px] font-bold text-seal">{s.stem === null ? " " : s.pos === "일" ? "나" : tenGod(day, s.stem)}</span>
            <Cell value={s.stem === null ? null : STEMS[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
            <Cell value={s.branch === null ? null : BRANCHES[s.branch]} el={s.branch === null ? null : BRANCH_EL[s.branch]} />
            {s.branch !== null && (
              <span className="flex flex-col text-[10px] leading-tight text-ink-soft">
                <span className="font-bold text-seal">{tenGod(day, HIDDEN[s.branch].at(-1)![0])}</span>
                {/* Too small for the brush hand: the plain face keeps these readable. */}
                <span>{HIDDEN[s.branch].map(([h]) => STEMS[h]).join("")}</span>
                <span>{stageOf(day, s.branch)}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {bars.map((n, el) => (
          <li key={el} className="flex items-center gap-2 text-xs">
            <span className="w-9 shrink-0 font-bold text-ink-soft">
              {ELEMENT_KO[el]} {ELEMENT_HANJA[el]}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
              <span className={`block h-full rounded-full ${EL_BAR[el]}`} style={{ width: `${(n / max) * 100}%` }} />
            </span>
            {shares ? (
              <span className={`w-16 shrink-0 text-right font-bold tabular-nums ${el === yong ? "text-seal" : ""}`}>
                {n}% <span className="font-normal text-ink-soft">({elements[el]}자)</span>
              </span>
            ) : (
              <span className={`w-4 text-right font-bold ${el === yong ? "text-seal" : ""}`}>{n}</span>
            )}
          </li>
        ))}
      </ul>

      {shares && <p className="mt-1.5 text-[10.5px] text-ink-soft">겉 글자 수가 아니라, 땅 글자 속에 숨은 기운과 자리·태어난 계절까지 따진 실제 비중이에요. 그래서 겉에 없는 기운도 %가 나올 수 있어요.</p>}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-hanji">{strength}</span>
        {gyeok && <span className="rounded-full border border-ink/40 px-2.5 py-1 font-bold">{gyeok}</span>}
        <span className="rounded-full border border-seal/50 px-2.5 py-1 font-bold text-seal">
          용신 {ELEMENT_KO[yong]}({ELEMENT_HANJA[yong]})
        </span>
      </div>
      {slots[0].stem === null && (
        <p className="mt-2 text-center text-[11px] text-ink-soft">태어난 시간을 몰라 여섯 글자로 {kingdom ? "보았사옵니다" : "봤어요"}</p>
      )}
      {kingdom && missing.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5 text-center text-[13px] font-bold text-ink">
          {missing.map((el) => (
            <li key={el}>{MISSING_LINE[el]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
