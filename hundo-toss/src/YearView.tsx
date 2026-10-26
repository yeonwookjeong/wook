import { useMemo } from "react";
import { profileOf, type Person } from "@/lib/pairToken";
import { isPreview, thisYear, VERDICT_MARK, yearDetail } from "@/lib/yeonun";
import { yearForSale } from "./catalog";

const RATING = ["조심", "보통", "좋음", "아주 좋음"] as const;
// A 사주 month starts on its 절기 (2/4, 3/6…); it is named by the solar month it starts in.
const monthName = (from: string) => `${Number(from.split("/")[0])}월`;

// 신년운세 for free, as on the site: the year's verdict, its theme, the plain findings and a bar for each month.
// Computed here on the phone (no AI); the written report is what is sold.
export function YearView({ me, onBuy }: { me: Person; onBuy: () => void }) {
  const y = yearForSale();
  const d = useMemo(() => yearDetail(me.pillars, profileOf(me), y, thisYear()), [me, y]);

  if (!d)
    return (
      <section className="card">
        <p>태어난 시각까지 알아야 신년운세를 볼 수 있어요. 아래 “내 정보 다시 입력”에서 고쳐 주세요.</p>
      </section>
    );

  return (
    <section className="stack">
      <div className="card">
        <p className="kicker">
          {d.year} {d.hanja} · {isPreview(d.year) ? "미리 보는 신년운세" : "올해 운세"}
        </p>
        <h2>
          {VERDICT_MARK[d.verdict]} {d.verdict} · {d.theme}
        </h2>
        <p>{d.themeLine}</p>
        <p className="quiet">{d.line}</p>
      </div>

      <div className="card">
        <h3>달마다 흐름 (월)</h3>
        <div className="months">
          {d.months.map((m) => (
            <div key={m.from} className="month" title={RATING[m.rating]}>
              <span className={`bar r${m.rating}`} style={{ height: `${20 + m.rating * 22}px` }} />
              <span className="label">{Number(m.from.split("/")[0])}</span>
            </div>
          ))}
        </div>
        <p className="quiet">
          좋은 달 {d.best.map((i) => monthName(d.months[i].from)).join(", ")} · 조심할 달 {d.worst.map((i) => monthName(d.months[i].from)).join(", ")}
        </p>
        <p className="quiet small">사주의 달은 절기로 바뀌어서, 2월은 입춘(2월 4일 무렵)부터예요.</p>
      </div>

      {d.points.length > 0 && (
        <div className="card">
          <h3>짚어 볼 것</h3>
          <ul>
            {d.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="primary" onClick={onBuy}>
        {d.year} 신년운세 보고서로 자세히 보기
      </button>
    </section>
  );
}
