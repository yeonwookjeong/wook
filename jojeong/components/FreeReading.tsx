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
export default function FreeReading({ name, r, query, addGender, onLifeReport = false }: { name: string; r: Reading; query: string; addGender: string; onLifeReport?: boolean }) {
  const q = query ? `?${query}` : "";
  return (
    <>
      <Card hanja="性 向" title={`${name}님의 성향 지도`}>
        <p className="mt-1 text-center text-[12px] text-ink-soft">사주 속 다섯 가지 힘의 비율이에요</p>
        <ul className="mt-4 flex flex-col gap-2">
          {r.powers.map((x) => (
            <li key={x.group} className="flex items-center gap-2 text-[13px]">
              <span className="w-24 shrink-0 font-bold">{x.name}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                <span className="block h-full rounded-full bg-seal/80" style={{ width: `${Math.max(2, x.pct)}%` }} />
              </span>
              <span className="w-9 shrink-0 text-right tabular-nums">{x.pct}%</span>
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
        <p className="mt-2 text-[11px] text-ink-soft">상위·하위 표시는 사주 25만여 개 가운데 이 비율이 어디쯤인지예요.</p>
      </Card>

      <Card hanja="神 殺" title={`${name}님 사주 속 별`}>
        {r.sals.length ? (
          <ul className="mt-3 flex flex-col divide-y divide-seal/10">
            {r.sals.map((s) => (
              <li key={s.name} className="py-2.5">
                <p className="flex items-baseline gap-2">
                  <b className="font-myeongjo">{s.plain}</b>
                  <span className="text-[11px] text-ink-soft">{s.name}</span>
                  {s.rate !== null && <span className="ml-auto shrink-0 rounded-full bg-seal/10 px-2 py-0.5 text-[11px] font-bold text-seal">{perHundred(s.rate)}</span>}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink/85">{s.line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-center text-[14px] leading-relaxed">특별한 별이 드러나지 않는 담백한 사주예요. 그만큼 흔들림이 적고, 스스로 만든 것이 오래가요.</p>
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
                <li key={f.from} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${f.now ? "border-2 border-seal bg-seal/5" : f.past ? "opacity-70" : ""}`}>
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
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">대운은 1월 1일이 아니라 태어난 날 무렵에 넘어가요. 바뀌는 해 앞뒤 1년쯤은 두 흐름이 섞여 느껴져요.</p>
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
