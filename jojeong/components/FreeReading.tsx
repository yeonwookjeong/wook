import Link from "next/link";
import type { Domain } from "@/lib/domains";
import { MOODS, type FreeReading as Reading } from "@/lib/freeReading";
import { perHundred } from "@/lib/rarity";

const TOPIC: Record<Domain, string> = { jaemul: "돈", yeonae: "사랑", jikup: "일" };
const MOOD = {
  기회: { mark: "◎ 기회", cls: "bg-seal text-hanji" },
  무난: { mark: "○ 무난", cls: "bg-gold/20 text-ink" },
  다지기: { mark: "△ 다지기", cls: "bg-ink/10 text-ink" },
} as const;

// One colour per power, the same for everyone, so two people's maps can be set side by side.
const POWER_COLOR: Record<Reading["powers"][number]["group"], string> = {
  인성: "#b3261e",
  비겁: "#a87a22",
  관성: "#222d3b",
  재성: "#6b7f5a",
  식상: "#8a6e9e",
};

// The five powers as one circle: the whole ring is the chart, so the shares plainly add up to 100.
function PowerDonut({ powers }: { powers: Reading["powers"] }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const shown = [...powers].filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct);
  const top = shown[0];
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((a, x) => a + x.pct, 0));
  return (
    <svg viewBox="0 0 180 180" className="mx-auto mt-3 block size-44" role="img" aria-label={shown.map((x) => `${x.name} ${x.pct}%`).join(", ")}>
      {shown.map((x, i) => (
        <circle
          key={x.group}
          r={R}
          cx="90"
          cy="90"
          fill="none"
          stroke={POWER_COLOR[x.group]}
          strokeWidth="28"
          strokeDasharray={`${Math.max(0, (C * x.pct) / 100 - (shown.length > 1 ? 1.5 : 0))} ${C}`}
          strokeDashoffset={(-C * starts[i]) / 100}
          transform="rotate(-90 90 90)"
        />
      ))}
      <text x="90" y="80" textAnchor="middle" fontSize="11" fill="#62564c">
        가장 큰 힘
      </text>
      <text x="90" y="97" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#211b17">
        {top.name}
      </text>
      <text x="90" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={POWER_COLOR[top.group]}>
        {top.pct}%
      </text>
    </svg>
  );
}

function Card({ hanja, title, children }: { hanja: string; title: string; children: React.ReactNode }) {
  return (
    <section className="doc-paper mt-4 px-5 pt-5 pb-5">
      <p className="text-center font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">{hanja}</p>
      <h2 className="mt-1 text-center font-myeongjo text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

// The free reading's four computed blocks (lib/freeReading.ts): the five powers, the 신살, one line each on
// money, love and work, and the ten-year flow of life. Each ends where a paid report goes further.
// `onLifeReport`: this card sits on the 평생 사주 page itself, so the link to that report goes down to its payment
// (a link to the page one is on goes nowhere); it is the Paywall when locked, the written report once bought.
export default function FreeReading({
  name,
  r,
  query,
  addGender,
  onLifeReport = false,
}: {
  name: string;
  r: Reading;
  query: string;
  addGender: string;
  onLifeReport?: boolean;
}) {
  const q = query ? `?${query}` : "";
  return (
    <>
      <Card hanja="性 向" title={`${name}님의 성향 지도`}>
        <p className="mt-1 text-center text-[12px] text-ink-soft">내 사주를 한 판으로 나누면, 다섯 가지 힘이 이만큼씩이에요</p>
        <PowerDonut powers={r.powers} />
        <ul className="mt-4 flex flex-col gap-1.5">
          {[...r.powers]
            .sort((a, b) => b.pct - a.pct)
            .map((x) => (
              <li key={x.group} className={`flex items-center gap-2 text-[13px] ${x.pct ? "" : "text-ink-soft"}`}>
                <span
                  className="size-3 shrink-0 rounded-[3px]"
                  style={x.pct ? { background: POWER_COLOR[x.group] } : { border: `1.5px dashed ${POWER_COLOR[x.group]}` }}
                />
                <span className={x.pct ? "font-bold" : ""}>{x.name}</span>
                <span className={`ml-auto tabular-nums ${x.pct ? "font-extrabold" : ""}`}>{x.pct ? `${x.pct}%` : "없음"}</span>
                <span className="w-16 shrink-0 text-right text-[11px] font-bold text-seal">{x.rank ?? ""}</span>
              </li>
            ))}
        </ul>
        <div className="mt-4 grid gap-2 text-[14px] leading-relaxed">
          <p className="rounded-xl bg-seal/5 px-3 py-2">
            <b className="text-seal">가장 강한 힘 · {r.strong.name}</b>
            <br />
            {r.strong.line}
          </p>
          <p className="rounded-xl bg-ink/5 px-3 py-2">
            <b>가장 약한 힘 · {r.weak.name}</b>
            <br />
            {r.weak.line}
          </p>
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">상위·하위는 1950~2008년에 태어날 수 있는 모든 날·시의 사주와 비교했어요.</p>
      </Card>

      <Card hanja="神 殺" title={`${name}님 사주 속 별`}>
        {r.sals.length ? (
          <ul className="mt-3 flex flex-col divide-y divide-seal/10">
            {r.sals.map((s) => (
              <li key={s.name} className="py-2.5">
                <p className="flex items-baseline gap-2">
                  <b className="font-myeongjo">{s.plain}</b>
                  <span className="text-[11px] text-ink-soft">{s.name}</span>
                  {s.rate !== null && (
                    <span className="ml-auto shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{perHundred(s.rate)}</span>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink/85">{s.line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-center text-[14px] leading-relaxed">
            특별한 별이 드러나지 않는 담백한 사주예요. 그만큼 흔들림이 적고, 스스로 만든 것이 오래가요.
          </p>
        )}
      </Card>

      {r.domains.length > 0 && (
        <Card hanja="三 事" title="돈 · 사랑 · 일, 한 줄 판정">
          <ul className="mt-3 flex flex-col gap-2">
            {r.domains.map(({ domain, card }) => (
              <li key={domain}>
                <Link href={`/reports/${domain}${q}`} className="flex items-start gap-3 rounded-2xl border border-seal/20 bg-white/50 px-4 py-3">
                  <span className="w-10 shrink-0 font-myeongjo text-lg font-extrabold whitespace-nowrap text-seal">{TOPIC[domain]}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-myeongjo">{card.type}</b>
                    <span className="block text-[12px] leading-snug text-ink-soft">{card.line}</span>
                    <span className="mt-1 block text-right text-[12px] font-bold text-seal">왜 그런지, 언제인지 →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card hanja="運 路" title={`${name}님의 인생 흐름`}>
        {r.flow ? (
          <>
            <p className="mt-1 text-center text-[12px] text-ink-soft">10년마다 바뀌는 큰 흐름(대운)이에요. 지나온 시기가 맞는지 먼저 확인해 보세요</p>
            <ol className="mt-4 flex flex-col gap-1.5">
              {r.flow.map((f) => (
                <li
                  key={f.from}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${f.now ? "border-2 border-seal bg-seal/5" : f.past ? "opacity-70" : ""}`}
                >
                  <span className="w-20 shrink-0 text-[12px] leading-tight">
                    <b className="block">{f.age || `${f.from}년~`}</b>
                    <span className="text-[10px] text-ink-soft">
                      {f.from}~{f.to}
                    </span>
                  </span>
                  <span className={`w-16 shrink-0 rounded-md py-0.5 text-center text-[11px] font-bold ${MOOD[f.mood].cls}`}>{MOOD[f.mood].mark}</span>
                  <span className="min-w-0 flex-1 text-[13px]">{f.theme}</span>
                  {f.now && <span className="shrink-0 text-[11px] font-extrabold text-seal">지금</span>}
                </li>
              ))}
            </ol>
            <dl className="mt-3 grid gap-1 text-[11px] leading-relaxed text-ink-soft">
              {(Object.keys(MOODS) as (keyof typeof MOODS)[]).map((m) => (
                <div key={m} className="flex gap-2">
                  <dt className="w-14 shrink-0 font-bold text-ink">{MOOD[m].mark}</dt>
                  <dd>{MOODS[m]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              대운은 1월 1일이 아니라 태어난 날 무렵에 넘어가요. 바뀌는 해 앞뒤 1년쯤은 두 흐름이 섞여 느껴져요.
            </p>
            {onLifeReport ? (
              <a href="#report-start" className="mt-3 block text-right text-[12px] font-bold text-seal">
                시기마다 무슨 일이 생기는지 · 아래에서 이어 보기 ↓
              </a>
            ) : (
              <Link href={`/reports/pyeongsaeng${q}`} className="mt-3 block text-right text-[12px] font-bold text-seal">
                시기마다 무슨 일이 생기는지 · 평생 사주 →
              </Link>
            )}
          </>
        ) : (
          <p className="mt-3 text-center text-[14px] leading-relaxed">
            성별을 알려 주시면 10년 단위 인생 흐름을 그려 드려요.{" "}
            <Link href={addGender} className="font-bold text-seal underline">
              성별 넣고 다시 보기
            </Link>
          </p>
        )}
      </Card>
    </>
  );
}
