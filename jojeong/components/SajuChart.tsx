import { stageOf } from "@/lib/deep";
import { ELEMENT_HANJA, ELEMENT_KO, BRANCH_EL, GYEOK_NAME, HIDDEN, stemEl, tenGod, type Slot } from "@/lib/myeongri";
import { GYEOK_TEXT } from "@/lib/yearText";
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

// The chips in plain words (explain): how strong the self is, what the frame means, what the balancing element brings.
const STRENGTH_PLAIN: Record<string, string> = {
  극신강: "나를 받쳐 주는 힘이 아주 센 사주예요. 혼자 밀고 나가는 힘이 크지만, 힘을 빼고 밖으로 쓰는 쪽이 오히려 잘 풀려요.",
  신강: "나를 받쳐 주는 힘이 센 편이에요. 내 뜻대로 끌고 가는 힘이 있고, 그 힘을 일과 사람에게 쓸 때 빛나요.",
  신약: "나를 받쳐 주는 힘이 약한 편이에요. 혼자 다 지기보다 도와주는 사람과 환경을 곁에 둘 때 힘이 나요.",
  극신약: "나를 받쳐 주는 힘이 아주 약한 사주예요. 버티기보다 흐름을 타고, 믿을 사람과 함께 갈 때 잘 풀려요.",
};
const GYEOK_GOD: Record<string, string> = Object.fromEntries(Object.entries(GYEOK_NAME).map(([god, name]) => [name, god]));
const YONG_PLAIN = ["새로 시작하고 뻗어 나가는 힘", "드러내고 표현하는 열정", "버티고 중심을 잡는 힘", "끊고 결단하는 힘", "쉬어 가며 깊이 생각하는 힘"];

export default function SajuChart({
  slots,
  elements,
  strength,
  yong,
  missing,
  gyeok,
  kingdom = true,
  weights,
  ranks,
  explain = false,
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
  // Where each share stands among everyone (lib/rarity.ts elementRank): "상위 9%" beside the bar when it stands out.
  ranks?: { side: "high" | "low"; rate: number }[];
  // The three chips (strength, frame, balancing element) told in plain words under them.
  explain?: boolean;
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
            ) : null}
            {shares && ranks ? (
              <span className="w-14 shrink-0 text-right text-[10.5px] font-bold">
                {ranks[el].rate <= 0.3 ? (
                  <span className={`rounded px-1 py-0.5 ${ranks[el].side === "high" ? "bg-seal/12 text-seal" : "bg-ink/8 text-ink-soft"}`}>
                    {ranks[el].side === "high" ? "상위" : "하위"} {Math.max(1, Math.round(ranks[el].rate * 100))}%
                  </span>
                ) : (
                  <span className="font-normal text-ink-soft">보통</span>
                )}
              </span>
            ) : shares ? null : (
              <span className={`w-4 text-right font-bold ${el === yong ? "text-seal" : ""}`}>{n}</span>
            )}
          </li>
        ))}
      </ul>

      {shares && <p className="mt-1.5 text-[10.5px] text-ink-soft">겉 글자 수가 아니라, 땅 글자 속에 숨은 기운과 자리·태어난 계절까지 따진 실제 비중이에요. 그래서 겉에 없는 기운도 %가 나올 수 있어요.{ranks ? " 상위·하위는 1950~2008년에 태어날 수 있는 모든 날·시의 사주와 견준 값이에요." : ""}</p>}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        <span className="rounded-full bg-ink px-2.5 py-1 font-bold text-hanji">{strength}</span>
        {gyeok && <span className="rounded-full border border-ink/40 px-2.5 py-1 font-bold">{gyeok}</span>}
        <span className="rounded-full border border-seal/50 px-2.5 py-1 font-bold text-seal">
          용신 {ELEMENT_KO[yong]}({ELEMENT_HANJA[yong]})
        </span>
      </div>
      {explain && (
        <dl className="mt-3 flex flex-col gap-1.5 rounded-lg bg-white/60 px-3 py-2.5 text-[12px] leading-snug ring-1 ring-seal/10">
          <div>
            <dt className="inline font-bold">{strength}</dt> <dd className="inline">· {STRENGTH_PLAIN[strength] ?? "한쪽 기운을 따라가는 특별한 사주예요. 그 기운을 거스르지 않을 때 잘 풀려요."}</dd>
          </div>
          {gyeok && GYEOK_GOD[gyeok] && (
            <div>
              <dt className="inline font-bold">{gyeok}</dt>{" "}
              <dd className="inline">· 태어난 달이 정한 사주의 큰 틀이에요. {GYEOK_TEXT[GYEOK_GOD[gyeok]]}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-bold">
              용신 {ELEMENT_KO[yong]}({ELEMENT_HANJA[yong]})
            </dt>{" "}
            <dd className="inline">
              · 내 사주의 균형을 잡아 주는 기운이에요. {["목은", "화는", "토는", "금은", "수는"][yong]} {YONG_PLAIN[yong]}이에요. 이 기운이 드는 해·사람·환경이 나를 도와요.
            </dd>
          </div>
        </dl>
      )}
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
