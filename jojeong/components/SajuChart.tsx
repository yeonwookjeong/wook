import { ELEMENT_HANJA, ELEMENT_KO, BRANCH_EL, stemEl, type Slot } from "@/lib/myeongri";
import { BRANCHES, STEMS } from "@/lib/saju";

// Element colours follow the traditional 오방색 loosely: 木 green, 火 red, 土 ochre, 金 grey-white, 水 black-blue.
const EL_STYLE = [
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

function Cell({ value, el }: { value: string | null; el: number | null }) {
  if (value === null || el === null) {
    return <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-ink/20 text-ink-soft">?</div>;
  }
  return (
    <div className={`flex aspect-square flex-col items-center justify-center rounded-lg ${EL_STYLE[el]}`}>
      <span className="font-myeongjo text-xl leading-none font-extrabold">{value}</span>
      <span className="mt-0.5 text-[10px] leading-none opacity-80">{ELEMENT_KO[el]}</span>
    </div>
  );
}

export default function SajuChart({
  slots,
  elements,
  strength,
  yong,
  missing,
}: {
  slots: Slot[];
  elements: number[];
  strength: string;
  yong: number;
  missing: number[];
}) {
  const max = Math.max(...elements, 1);
  return (
    <div className="mt-4 border border-seal/25 px-4 py-3">
      <p className="text-xs font-extrabold text-ink-soft">사주 원국 · 여덟 글자</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
        {slots.map((s) => (
          <div key={s.pos} className="flex flex-col gap-1.5">
            <span className="text-[11px] text-ink-soft">{s.pos}주</span>
            <Cell value={s.stem === null ? null : STEMS[s.stem]} el={s.stem === null ? null : stemEl(s.stem)} />
            <Cell value={s.branch === null ? null : BRANCHES[s.branch]} el={s.branch === null ? null : BRANCH_EL[s.branch]} />
          </div>
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {elements.map((n, el) => (
          <li key={el} className="flex items-center gap-2 text-xs">
            <span className="w-9 shrink-0 font-bold text-ink-soft">
              {ELEMENT_KO[el]} {ELEMENT_HANJA[el]}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/5">
              <span className={`block h-full rounded-full ${EL_BAR[el]}`} style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className={`w-4 text-right font-bold ${el === yong ? "text-seal" : ""}`}>{n}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-hanji">{strength}</span>
        <span className="rounded-full border border-seal/50 px-2.5 py-1 font-bold text-seal">
          용신 {ELEMENT_KO[yong]}({ELEMENT_HANJA[yong]})
        </span>
      </div>
      {slots[0].stem === null && (
        <p className="mt-2 text-center text-[11px] text-ink-soft">태어난 시간을 몰라 여섯 글자로 보았사옵니다</p>
      )}
      {missing.length > 0 && (
        <ul className="mt-2 flex flex-col gap-0.5 text-center text-[13px] font-bold text-ink">
          {missing.map((el) => (
            <li key={el}>{MISSING_LINE[el]}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
