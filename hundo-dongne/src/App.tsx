import { useEffect, useMemo, useState } from "react";
import { sajuYear as thisSajuYear } from "@/lib/yeonun";
import { getSchemeUri } from "@apps-in-toss/web-framework";
import type { Person } from "@/lib/pairToken";
import { BirthForm } from "./BirthForm";
import { saveCard, shareMessage, type Card } from "./card";
import { forgetAll, loadHome, loadMe, mateToken, readMate, saveHome, saveMe, type Mate } from "./me";
import {
  byCode, dirsOf, elName, guaFromNumber, guaOf, label, MAP, needOf, pairPlaces, PLACE_KIND, proj, rankOf, scoreAll, SIDOS, topPlaces,
  moveCheck, tagsOf, weekendPlan, whyOf, type Gua, type Need, type Region, type Scored,
} from "./place";

// The pair link's token, from the address the app was opened with (intoss://hundo-dongne?with=…), or the browser's.
function mateFromEntry(): Mate | null {
  let q = "";
  try {
    q = getSchemeUri().split("?")[1] ?? "";
  } catch {
    // outside the Toss app
  }
  if (!q) q = window.location.search.slice(1);
  return readMate(new URLSearchParams(q).get("with"));
}

// 점수 → 색: 덜 맞는 곳은 한지색, 잘 맞는 곳일수록 인장 빨강.
export function shade(score: number | null): string {
  if (score === null) return "#cfc4ad";
  const t = Math.max(0, Math.min(1, (score - 30) / 66)) ** 2;
  const a = [236, 226, 204];
  const b = [179, 38, 30];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

export default function App() {
  const [me, setMe] = useState<Person | null | undefined>(undefined);
  const [home, setHome] = useState<Region | null | undefined>(undefined);
  const [mate] = useState<Mate | null>(mateFromEntry);

  useEffect(() => {
    loadMe().then(setMe);
    loadHome().then((c) => setHome(byCode(c)));
  }, []);

  if (me === undefined || home === undefined) return <main className="app" />;
  if (me === null)
    return (
      <main className="app">
        {mate && (
          <p className="notice">
            <b>{mate.name}</b>님이 둘이 살면 좋은 동네를 같이 보자고 했어요. 내 생일을 넣으면 바로 나와요.
          </p>
        )}
        <BirthForm
          title="내 사주에 맞는 동네는 어디일까"
          cta="내 동네 찾기"
          onDone={(p) => {
            void saveMe(p);
            setMe(p);
          }}
        />
      </main>
    );
  if (home === null)
    return (
      <main className="app">
        <HomePick
          me={me}
          onPick={(r) => {
            void saveHome(r.code);
            setHome(r);
          }}
        />
      </main>
    );
  return (
    <main className="app">
      <Result
        me={me}
        home={home}
        mate={mate}
        onMove={() => setHome(null)}
        onForget={() => {
          void forgetAll();
          setMe(null);
          setHome(null);
        }}
      />
    </main>
  );
}

function HomePick({ me, onPick, initial }: { me: Person; onPick: (r: Region) => void; initial?: Region }) {
  const [sido, setSido] = useState(initial?.sido ?? "");
  return (
    <section className="card stack">
      <p className="kicker">지금 사는 곳</p>
      <h1>{me.name}님은 지금 어디에 사세요?</h1>
      <p className="quiet small">나에게 맞는 동네 순위는 어디 살든 같아요. 사는 곳은 주말 나들이 거리와 이사 방향을 볼 때만 써요. 주소는 받지 않고, 고른 곳은 이 휴대폰에만 남아요.</p>
      <div className="row place-pick">
        <select aria-label="시도" value={sido} onChange={(e) => setSido(e.target.value)}>
          <option value="">시도</option>
          {SIDOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select aria-label="시군구" value="" onChange={(e) => byCode(e.target.value) && onPick(byCode(e.target.value)!)} disabled={!sido}>
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
    </section>
  );
}

function Result({ me, home, mate, onMove, onForget }: { me: Person; home: Region; mate: Mate | null; onMove: () => void; onForget: () => void }) {
  const need = useMemo(() => needOf(me.pillars), [me]);
  const gua = useMemo(() => guaOf(me), [me]);
  const all = useMemo(() => (need ? scoreAll(home, need, gua) : []), [home, need, gua]);
  const weekend = useMemo(() => weekendPlan(me, all), [me, all]);
  const top = useMemo(() => topPlaces(all), [all]);
  const [picked, setPicked] = useState<Scored | null>(null);
  const [toast, setToast] = useState("");

  const mateHome = mate ? byCode(mate.home) : null;
  const mateNeed = useMemo(() => (mate ? needOf(mate.pillars) : null), [mate]);
  const pair = useMemo(() => (mateHome && mateNeed ? pairPlaces(all, scoreAll(mateHome, mateNeed, guaFromNumber(mate!.gua))) : []), [all, mateHome, mateNeed, mate]);

  if (!need) return <p className="card">사주를 읽지 못했어요. 생일을 다시 넣어 주세요.</p>;
  const first = top[0];
  const say = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2400);
  };
  const save = async (card: Card, name: string) => say((await saveCard(card, name)) === "saved" ? "사진첩에 저장했어요" : "저장하지 못했어요");
  const rankShade = new Map(all.map((r) => [r.code, shade(r.score)]));

  return (
    <section className="stack">
      {first && (
        <div className="card hero">
          <p className="kicker">내 사주 명당</p>
          <h1>
            {me.name}님의 기운을 채우는 동네 1위
          </h1>
          <p className="place-big">{label(first)}</p>
          {whyOf(first, need).map((l) => (
            <p key={l} className="why">
              {l}
            </p>
          ))}
          <div className="row two">
            <button className="primary" onClick={() => save({ kind: "one", who: me.name, place: first, lines: whyOf(first, need), home }, "내사주동네.png")}>
              카드 저장
            </button>
            <button
              className="ghost"
              onClick={() => shareMessage(`내 사주에 맞는 동네 1위는 ${label(first)}래. 너는 어디야?`).then((ok) => ok && say("보냈어요"))}
            >
              친구에게 보내기
            </button>
          </div>
        </div>
      )}

      <WeekendBox me={me} need={need} days={weekend} onPick={setPicked} />

      <div className="card">
        <p className="quiet small">
          {me.name}님 사주는 {elName(need.heavy)} 기운이 가장 많아요. 그래서 <strong className="seal">{elName(need.yong)}</strong> 기운이 넉넉한 땅이 가장 잘 맞고, 그다음은{" "}
          <strong>{elName(need.hee)}</strong> 기운이에요. 사는 곳 <strong>{label(home)}</strong>
          <button className="inline" onClick={onMove}>
            바꾸기
          </button>
        </p>
      </div>

      <div className="card map-card">
        <h3>전국 {all.filter((r) => r.score !== null).length}곳, 진할수록 잘 맞아요</h3>
        <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} role="img" aria-label="전국 시군구 지도, 잘 맞는 곳일수록 진한 빨강">
          {all.map((r) => (
            <path key={r.code} d={r.d} aria-label={label(r)} fill={picked?.code === r.code ? "#211b17" : shade(r.score)} stroke="#f4ecdb" strokeWidth={0.6} onClick={() => setPicked(r)} />
          ))}
          {(() => {
            const { x, y } = proj(home);
            return (
              <g pointerEvents="none">
                <circle cx={x} cy={y} r={8} fill="#211b17" stroke="#f4ecdb" strokeWidth={3} />
                <text x={x + 13} y={y - 9} fontSize={17} fontWeight={800} fill="#211b17">
                  지금 사는 곳
                </text>
              </g>
            );
          })()}
        </svg>
        {picked ? <Picked r={picked} all={all} need={need} gua={gua} me={me} home={home} shadeMap={rankShade} onSave={save} /> : <p className="quiet small center">회사나 이사 후보 동네를 눌러 보세요. 순위와 이유가 나와요.</p>}
      </div>

      <div className="card">
        <h3>{me.name}님에게 잘 맞는 동네 TOP5</h3>
        <p className="quiet small">시도마다 가장 잘 맞는 한 곳씩 골랐어요.</p>
        <ol className="top">
          {top.map((r, i) => (
            <li key={r.code} onClick={() => setPicked(r)}>
              <b>{i + 1}</b>
              <span>{label(r)}</span>
              <em>{tagsOf(r)}</em>
              <strong>{Math.round(r.score!)}점</strong>
            </li>
          ))}
        </ol>
        <p className="soft">
          {elName(need.gi)} 기운이 센 땅은 {me.name}님에게 조금 버거워요. 그런 곳에 살거나 다녀야 한다면, 집 안의 {dirsOf(need.yong)} 자리를 밝게 쓰고 자주 머무르세요.
        </p>
      </div>

      <PairBox me={me} home={home} mate={mate} pair={pair} onSave={save} say={say} />

      <p className="quiet small">
        땅의 산과 물로 기운을 보는 건 풍수에서 쓰는 생활 방법이에요. 이 점수만으로 이사나 직장을 정하진 마시고, 비슷한 두 곳 중에 고를 때 참고하세요. 행정구역은 {MAP.asOf.replace(/-/g, ".")} 기준이에요.
      </p>
      <button className="link" onClick={onForget}>
        내 정보 지우기
      </button>
      {toast && <p className="toast">{toast}</p>}
    </section>
  );
}

function Picked({ r, all, need, gua, me, home, shadeMap, onSave }: { r: Scored; all: Scored[]; need: Need; gua: Gua | null; me: Person; home: Region; shadeMap: Map<string, string>; onSave: (c: Card, name: string) => void }) {
  const rk = rankOf(all, r.code);
  if (!rk) return <p className="picked"><strong>{label(r)}</strong> 이 동네는 땅 정보가 없어요.</p>;
  const lines = whyOf(r, need);
  const pct = Math.max(1, Math.round((rk.rank / rk.of) * 100));
  return (
    <div className="picked">
      <p>
        <strong>{label(r)}</strong> <span className="quiet">{r.km}km</span>
      </p>
      <p className="rank">
        {rk.of}곳 중 <b>{rk.rank}</b>위 <span className="quiet">(위에서 {pct}%)</span>
      </p>
      {lines.map((l) => (
        <p key={l} className="why">
          {l}
        </p>
      ))}
      <div className="move">
        <p className="kicker">이사 방향 점검 ({label(home)}에서)</p>
        {moveCheck(r, need, thisSajuYear()).map((l) => (
          <p key={l} className="quiet small">
            {l}
          </p>
        ))}
        {!gua && <p className="quiet small">성별을 넣으면 팔택 방향까지 같이 봐요.</p>}
      </div>
      <button className="ghost" onClick={() => onSave({ kind: "rank", who: me.name, place: r, rank: rk.rank, of: rk.of, lines, home, shade: shadeMap }, "동네성적표.png")}>
        이 동네 성적표 카드 저장
      </button>
    </div>
  );
}

function PairBox({ me, home, mate, pair, onSave, say }: { me: Person; home: Region; mate: Mate | null; pair: ReturnType<typeof pairPlaces>; onSave: (c: Card, name: string) => void; say: (s: string) => void }) {
  const mateHome = mate ? byCode(mate.home) : null;
  const invite = () =>
    shareMessage(`우리 둘이 살면 좋은 동네가 어딘지 같이 볼래? 생일만 넣으면 바로 나와`, `intoss://hundo-dongne?with=${mateToken(me, home.code, guaOf(me)?.n ?? null)}`).then((ok) => ok && say("보냈어요"));
  if (!mate || !mateHome || pair.length === 0)
    return (
      <div className="card">
        <p className="kicker">우리 둘의 동네</p>
        <h3>연인, 친구, 가족과 둘 다 좋은 동네</h3>
        <p className="quiet small">링크를 보내면 상대가 자기 생일을 넣는 순간 둘 다 기운이 채워지는 동네가 나와요. 링크에는 이름, 사주 여덟 글자, 사는 시군구만 들어가요.</p>
        <button className="primary" onClick={invite}>
          같이 볼 사람에게 링크 보내기
        </button>
      </div>
    );
  const best = pair[0];
  const lines = [`${me.name}님에게 ${Math.round(best.mine)}점, ${mate.name}님에게 ${Math.round(best.theirs)}점`, "둘 다 기운이 채워지는 몇 안 되는 자리예요"];
  return (
    <div className="card hero">
      <p className="kicker">우리 둘의 동네</p>
      <h3>
        {me.name} ♥ {mate.name}, 함께 살면 좋은 곳
      </h3>
      <p className="place-big">{label(best)}</p>
      {lines.map((l) => (
        <p key={l} className="why">
          {l}
        </p>
      ))}
      <ol className="top">
        {pair.slice(1).map((r, i) => (
          <li key={r.code}>
            <b>{i + 2}</b>
            <span>{label(r)}</span>
            <em>
              {Math.round(r.mine)}점, {Math.round(r.theirs)}점
            </em>
          </li>
        ))}
      </ol>
      <div className="row two">
        <button className="primary" onClick={() => onSave({ kind: "pair", who: me.name, mate: mate.name, place: best, lines, homes: [home, mateHome] }, "우리둘의동네.png")}>
          카드 저장
        </button>
        <button className="ghost" onClick={invite}>
          다른 사람과도 보기
        </button>
      </div>
    </div>
  );
}

// 이번 주말 명당: Saturday and Sunday, how far to go and two places each.
function WeekendBox({ me, need, days, onPick }: { me: Person; need: Need; days: ReturnType<typeof weekendPlan>; onPick: (r: Scored) => void }) {
  return (
    <div className="card">
      <p className="kicker">이번 주말 명당</p>
      <h3>{me.name}님, 이번 주말엔 여기로 가 보세요</h3>
      {days.map((d) => (
        <div key={d.date} className="weekend-day">
          <p>
            <strong>
              {d.date} ({d.weekday})
            </strong>{" "}
            {d.tone && <span className="tone">{d.tone}</span>}
          </p>
          <p className="quiet small">{d.why}. {d.band.label} 거리를 골랐어요.</p>
          {d.places.length ? (
            <ol className="top">
              {d.places.map((r, i) => (
                <li key={r.code} onClick={() => onPick(r)}>
                  <b>{i + 1}</b>
                  <span>{label(r)}</span>
                  <em>
                    {r.dir}쪽 {r.km}km
                  </em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="quiet small">이 거리 안에는 잘 맞는 곳이 없어요. 집 근처에서 쉬어 가세요.</p>
          )}
        </div>
      ))}
      <p className="quiet small">
        {me.name}님에게 필요한 {elName(need.yong)} 기운은 {PLACE_KIND[need.yong]} 같은 곳에서 채우기 좋아요. 매주 새로 바뀌어요.
      </p>
    </div>
  );
}
