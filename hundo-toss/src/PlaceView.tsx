import { useEffect, useMemo, useState } from "react";
import { Share } from "@apps-in-toss/web-framework";
import type { Person } from "@/lib/pairToken";
import { readItem, writeItem } from "./me";
import { EL_HANJA, elName, label, MAP, needOf, proj, scoreAll, SIDOS, topPlaces, weakSide, type Region, type Scored } from "./place";

const BASE_KEY = "hundo:place-base";

// 점수 → 색: 덜 맞는 곳은 한지색, 잘 맞는 곳일수록 인장 빨강.
function shade(score: number | null): string {
  if (score === null) return "#cfc4ad";
  const t = Math.max(0, Math.min(1, (score - 30) / 66)) ** 2;
  const a = [236, 226, 204];
  const b = [179, 38, 30];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

const dirsOf = (el: number) =>
  ({ 0: "동쪽, 남동쪽", 1: "남쪽", 2: "북동쪽, 남서쪽", 3: "서쪽, 북서쪽", 4: "북쪽" })[el as 0 | 1 | 2 | 3 | 4];

// 내 사주에 맞는 동네 지도: pick where one lives, see every 시군구 shaded by how well its direction suits the chart,
// the top five (one per 시도), and tap any place (회사, 이사 후보) for its own score.
export function PlaceView({ me, onBuy }: { me: Person; onBuy: () => void }) {
  const need = useMemo(() => needOf(me.pillars), [me]);
  const [base, setBase] = useState<Region | null>(null);
  const [sido, setSido] = useState<string>("");
  const [picked, setPicked] = useState<Scored | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    readItem(BASE_KEY).then((code) => {
      const r = MAP.regions.find((x) => x.code === code);
      if (r) {
        setBase(r);
        setSido(r.sido);
      }
    });
  }, []);

  const all = useMemo(() => (base && need ? scoreAll(base, need) : null), [base, need]);
  const top = useMemo(() => (all ? topPlaces(all) : []), [all]);

  if (!need) return <p className="card">사주를 읽지 못했어요. 생일을 다시 넣어 주세요.</p>;

  const choose = (code: string) => {
    const r = MAP.regions.find((x) => x.code === code) ?? null;
    setBase(r);
    setPicked(null);
    if (r) void writeItem(BASE_KEY, r.code);
  };

  const share = async () => {
    const first = top[0] ? label(top[0]) : "";
    let link = "";
    try {
      link = await Share.createLink({ path: "intoss://hundo-saju" });
    } catch {
      // Outside the Toss app: the message goes without a link.
    }
    try {
      await Share.sendMessage({ message: `내 사주에 맞는 동네 1위는 ${first}래. 너는 어디야?${link ? `\n${link}` : ""}` });
      setShared(true);
    } catch {
      // The viewer closed the sheet.
    }
  };

  return (
    <section className="stack">
      <div className="card">
        <p className="kicker">풍수 방위 × 내 사주</p>
        <h2>{me.name}님에게 맞는 동네 지도</h2>
        <p>
          {me.name}님 사주는 <strong>{elName(need.heavy)} 기운이 가장 많아요</strong>. 그래서{" "}
          <strong className="seal">
            {dirsOf(need.yong)}({EL_HANJA[need.yong]})
          </strong>
          이 가장 잘 맞고, 그다음은 <strong>{dirsOf(need.hee)}</strong>이에요.
        </p>
      </div>

      <div className="card">
        <h3>지금 사는 곳</h3>
        <div className="row place-pick">
          <select aria-label="시도" value={sido} onChange={(e) => setSido(e.target.value)}>
            <option value="">시도</option>
            {SIDOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select aria-label="시군구" value={base?.sido === sido ? base.code : ""} onChange={(e) => choose(e.target.value)} disabled={!sido}>
            <option value="">시군구</option>
            {MAP.regions
              .filter((r) => r.sido === sido)
              .map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
          </select>
        </div>
        <p className="quiet small">주소는 받지 않아요. 고른 곳은 이 휴대폰에만 남아요.</p>
      </div>

      {base && all && (
        <>
          <div className="card map-card">
            <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} role="img" aria-label="전국 시군구 지도, 잘 맞는 곳일수록 진한 빨강">
              {all.map((r) => (
                <path
                  key={r.code}
                  d={r.d}
                  aria-label={label(r)}
                  fill={picked?.code === r.code ? "#211b17" : shade(r.score)}
                  stroke="#f4ecdb"
                  strokeWidth={0.6}
                  onClick={() => setPicked(r)}
                />
              ))}
              {(() => {
                const { x, y } = proj(base);
                return (
                  <g pointerEvents="none">
                    <circle cx={x} cy={y} r={8} fill="#211b17" stroke="#f4ecdb" strokeWidth={3} />
                    <text x={x + 13} y={y - 9} fontSize={17} fontWeight={800} fill="#211b17">
                      지금 사는 곳
                    </text>
                  </g>
                );
              })()}
              <g fontSize={19} fontWeight={800} fill="#86601a" textAnchor="middle" pointerEvents="none">
                <text x={MAP.w - 46} y={34}>北</text>
                <text x={MAP.w - 46} y={112}>南</text>
                <text x={MAP.w - 84} y={74}>西</text>
                <text x={MAP.w - 10} y={74}>東</text>
              </g>
            </svg>
            <p className="legend">
              덜 맞음 <i /> 잘 맞음
            </p>
            {picked ? (
              <p className="picked">
                <strong>{label(picked)}</strong>{" "}
                {picked.score === null ? "지금 사는 곳과 거의 같은 자리예요." : `${picked.dir}쪽, ${picked.score}점`}
              </p>
            ) : (
              <p className="quiet small center">회사나 이사 후보 동네를 지도에서 눌러 보세요.</p>
            )}
          </div>

          <div className="card">
            <h3>{me.name}님에게 잘 맞는 동네 TOP5</h3>
            <ol className="top">
              {top.map((r, i) => (
                <li key={r.code}>
                  <b>{i + 1}</b>
                  <span>{label(r)}</span>
                  <em>
                    {r.dir}쪽, {EL_HANJA[r.el!]}
                  </em>
                  <strong>{r.score}점</strong>
                </li>
              ))}
            </ol>
            <p className="soft">
              아쉬운 쪽은 <strong>{weakSide(need)}</strong>이에요. 그쪽에 산다면 집 안의 {dirsOf(need.yong)} 자리를 밝게 쓰면 돼요.
            </p>
          </div>

          <button className="primary" onClick={share}>
            {shared ? "보냈어요" : "친구에게 내 동네 1위 보내기"}
          </button>
          <button className="link" onClick={onBuy}>
            이 기운이 왜 필요한지는 평생 사주에서
          </button>
          <p className="quiet small">
            솔직히 말씀드리면, 방향으로 기운을 보는 건 풍수에서 쓰는 생활 방법이에요. 이 점수만으로 이사나 직장을 정하진 마시고, 비슷한 두 곳 중에
            고를 때 참고하세요.
          </p>
        </>
      )}
    </section>
  );
}
