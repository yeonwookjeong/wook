"use client";

import { useEffect, useMemo, useState } from "react";
import { josa } from "@/lib/josa";
import type { Person } from "@/lib/pairToken";
import { sajuYear } from "@/lib/yeonun";
import {
  byCode, dirsOf, dongsOf, elName, goodStars, guaLabel, guaOf, label, loadDongs, localPlaces, lookAlikes, MAP, meetDays, meetPlaces,
  moveCheck, needOf, nickOf, PLACE_KIND, proj, rankOf, scoreAll, SIDOS, tagsOf, topPlaces, weatherOf, weekendPlan, whyOf,
  type DongData, type Gua, type Need, type Region, type Scored,
} from "@/lib/place";
import { ShareLinkButton } from "./ShareButtons";

// 내 사주 명당 on the site: the same engine as the Apps in Toss mini app (hundo-dongne, lib/place.ts). The chart comes
// from the saved reader (lib/me.ts); the 시군구 they live in is kept only in this browser (localStorage), the friends'
// places for 약속 명당 not at all.
const HOME_KEY = "jj_myeongdang_home";

// 점수 → 색: 덜 맞는 곳은 한지색, 잘 맞는 곳일수록 인장 빨강.
function shade(score: number | null): string {
  if (score === null) return "#cfc4ad";
  const t = Math.max(0, Math.min(1, (score - 30) / 66)) ** 2;
  const a = [236, 226, 204];
  const b = [179, 38, 30];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
}

const CARD = "card mt-4 px-5 py-5";
const KICKER = "text-xs font-extrabold tracking-wide text-seal";
const H3 = "mt-1 font-myeongjo text-lg font-extrabold leading-snug";
const QUIET = "text-[13px] leading-relaxed text-ink-soft";
const SELECT = "w-full rounded-xl border border-ink/20 bg-white px-3 py-3 text-[15px]";

export default function Myeongdang({ person }: { person: Person }) {
  const [home, setHome] = useState<Region | null | undefined>(undefined);
  useEffect(() => {
    let code: string | null = null;
    try {
      code = localStorage.getItem(HOME_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage
    setHome(byCode(code ?? "") ?? null);
  }, []);
  const pick = (r: Region | null) => {
    try {
      if (r) localStorage.setItem(HOME_KEY, r.code);
      else localStorage.removeItem(HOME_KEY);
    } catch {}
    setHome(r);
  };
  if (home === undefined) return <div className="min-h-[40vh]" />;
  if (home === null) return <HomePick name={person.name} onPick={pick} />;
  return <Result me={person} home={home} onMove={() => pick(null)} />;
}

function HomePick({ name, onPick }: { name: string; onPick: (r: Region) => void }) {
  const [sido, setSido] = useState("");
  return (
    <section className={CARD}>
      <p className={KICKER}>지금 사는 곳</p>
      <h2 className={H3}>{name}님은 지금 어디에 사세요?</h2>
      <p className={`mt-2 ${QUIET}`}>사는 지역 안에서 잘 맞는 동네부터 보여 드리고, 그다음 전국 순위를 보여 드려요. 주소는 받지 않고, 고른 곳은 이 브라우저에만 남아요.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <select aria-label="시도" className={SELECT} value={sido} onChange={(e) => setSido(e.target.value)}>
          <option value="">시도</option>
          {SIDOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select aria-label="시군구" className={SELECT} value="" disabled={!sido} onChange={(e) => byCode(e.target.value) && onPick(byCode(e.target.value)!)}>
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

function Rows({ list, onPick, home, short, right }: { list: Scored[]; onPick: (r: Scored) => void; home?: Region; short?: boolean; right?: (r: Scored) => React.ReactNode }) {
  return (
    <ol className="mt-3 divide-y divide-ink/10">
      {list.map((r, i) => (
        <li key={r.code}>
          <button type="button" onClick={() => onPick(r)} className={`flex w-full items-center gap-3 py-2.5 text-left ${r.code === home?.code ? "font-extrabold" : ""}`}>
            <b className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-seal text-sm text-hanji">{i + 1}</b>
            <span className="text-[15.5px]">
              {short ? r.name : label(r)}
              {r.code === home?.code ? " (사는 곳)" : ""}
            </span>
            <em className="text-xs not-italic text-ink-soft">{tagsOf(r)}</em>
            <span className="ml-auto shrink-0 text-[15px] font-extrabold text-seal">{right ? right(r) : `${Math.round(r.score!)}점`}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Result({ me, home, onMove }: { me: Person; home: Region; onMove: () => void }) {
  const need = useMemo(() => needOf(me.pillars), [me]);
  const gua = useMemo(() => guaOf(me), [me]);
  const all = useMemo(() => (need ? scoreAll(home, need, gua) : []), [home, need, gua]);
  const local = useMemo(() => localPlaces(all, home), [all, home]);
  const top = useMemo(() => topPlaces(all), [all]);
  const weekend = useMemo(() => weekendPlan(me, all), [me, all]);
  const alike = useMemo(() => (need ? lookAlikes(all, need) : []), [all, need]);
  const [picked, setPicked] = useState<Scored | null>(null);
  const [allLocal, setAllLocal] = useState(false);
  const show = (r: Scored) => {
    setPicked(r);
    requestAnimationFrame(() => document.getElementById("picked")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (!need || !local.list.length) return <p className={CARD}>사주를 읽지 못했어요. 생일을 다시 넣어 주세요.</p>;
  const first = local.list[0];
  const firstRank = rankOf(all, first.code)!;
  const homeAt = local.list.findIndex((r) => r.code === home.code);

  return (
    <>
      <section className="doc-paper mt-5 px-5 py-6 text-center">
        <p className={KICKER}>明堂 내 사주 명당</p>
        <h2 className="mt-2 font-myeongjo text-xl font-extrabold leading-snug">
          {local.area}에서 {me.name}님에게 가장 잘 맞는 동네
        </h2>
        <p className="mt-3 font-myeongjo text-[34px] font-extrabold leading-tight text-seal">{label(first)}</p>
        <div className="mt-3 space-y-1.5 text-left text-[15px] leading-relaxed">
          {whyOf(first, need).map((l) => (
            <p key={l}>{l}</p>
          ))}
          <DongLine code={first.code} need={need} lead="그중에서도" />
        </div>
        <p className={`mt-3 ${QUIET}`}>
          전국 {firstRank.of}곳 가운데서는 {firstRank.rank}위예요.
        </p>
        <div className="mt-4">
          <ShareLinkButton path="/myeongdang" text={`${local.area}에서 내 사주에 맞는 동네 1위는 ${first.name}래. 너는 어디야?`} label="친구에게 보내기" event="share_result" />
        </div>
      </section>

      <section className={CARD}>
        <p className={KICKER}>우리 지역 순위</p>
        <h3 className={H3}>
          {local.area} {local.list.length}곳, {me.name}님에게 잘 맞는 순서
        </h3>
        <Rows list={allLocal ? local.list : local.list.slice(0, 5)} onPick={show} home={home} short={!local.mixed} />
        {local.list.length > 5 && (
          <button type="button" className="mt-1 w-full py-2 text-sm text-ink-soft underline" onClick={() => setAllLocal(!allLocal)}>
            {allLocal ? "접기" : `${local.list.length}곳 모두 보기`}
          </button>
        )}
        {home.code !== first.code && <DongLine code={home.code} need={need} lead={`지금 사는 ${home.name} 안에서는`} />}
        {homeAt >= 0 && (
          <p className="mt-2 rounded-xl bg-hanji-deep/40 px-4 py-3 text-[14px] leading-relaxed">
            {homeAt === 0
              ? `지금 사는 ${josa(home.name, "이/가")} 이 지역에서 가장 잘 맞아요. 이미 명당에 살고 계셔요.`
              : homeAt < local.list.length / 3
                ? `지금 사는 ${josa(home.name, "은/는")} ${local.list.length}곳 중 ${homeAt + 1}위예요. 꽤 잘 맞는 곳에 살고 계셔요.`
                : `지금 사는 ${josa(home.name, "은/는")} ${local.list.length}곳 중 ${homeAt + 1}위예요. 주말이나 산책은 ${first.name} 쪽으로 다니면 모자란 기운을 채우기 좋아요.`}
          </p>
        )}
      </section>

      <section className={CARD}>
        <p className="text-[14px] leading-relaxed">
          {me.name}님 사주는 {elName(need.heavy)} 기운이 가장 많아요. 그래서 <b className="text-seal">{elName(need.yong)}</b> 기운이 넉넉한 땅이 가장 잘 맞고, 그다음은{" "}
          <b>{elName(need.hee)}</b> 기운이에요. <GuaLine gua={gua} />
        </p>
        <p className={`mt-2 ${QUIET}`}>
          사는 곳 <b className="text-ink">{label(home)}</b>{" "}
          <button type="button" className="underline" onClick={onMove}>
            바꾸기
          </button>
        </p>
      </section>

      <section className={CARD}>
        <h3 className={H3}>전국 {all.filter((r) => r.score !== null).length}곳, 진할수록 잘 맞아요</h3>
        <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} role="img" aria-label="전국 시군구 지도, 잘 맞는 곳일수록 진한 빨강" className="mt-3 w-full">
          {all.map((r) => (
            <path key={r.code} d={r.d} aria-label={label(r)} fill={picked?.code === r.code ? "#211b17" : shade(r.score)} stroke="#f4ecdb" strokeWidth={0.6} onClick={() => setPicked(r)} className="cursor-pointer" />
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
        <div id="picked" className="scroll-mt-4">
          {picked ? <Picked r={picked} all={all} need={need} gua={gua} home={home} /> : <p className={`mt-2 text-center ${QUIET}`}>회사나 이사 후보 동네를 눌러 보세요. 순위와 이유가 나와요.</p>}
        </div>
      </section>

      <section className={CARD}>
        <p className={KICKER}>전국으로 넓히면</p>
        <h3 className={H3}>{me.name}님에게 잘 맞는 동네 전국 TOP5</h3>
        <p className={QUIET}>시도마다 가장 잘 맞는 한 곳씩 골랐어요.</p>
        <Rows list={top} onPick={show} />
        <p className="mt-2 rounded-xl bg-hanji-deep/40 px-4 py-3 text-[14px] leading-relaxed">
          {elName(need.gi)} 기운이 센 땅은 {me.name}님에게 조금 버거워요. 그런 곳에 살거나 다녀야 한다면, 집 안의 {dirsOf(need.yong)} 자리를 밝게 쓰고 자주 머무르세요.
        </p>
      </section>

      <section className={CARD}>
        <p className={KICKER}>이번 주말 명당</p>
        <h3 className={H3}>{me.name}님, 이번 주말엔 여기로 가 보세요</h3>
        {weekend.map((d) => (
          <div key={d.date} className="mt-3">
            <p className="text-[15px]">
              <b>
                {d.date} ({d.weekday})
              </b>{" "}
              {d.tone && <span className="rounded-md bg-seal/10 px-1.5 py-0.5 text-xs text-seal">{d.tone}</span>}
            </p>
            <p className={QUIET}>
              {d.why}. {d.band.label} 거리를 골랐어요.
            </p>
            {d.places.length ? (
              <Rows list={d.places} onPick={show} right={(r) => <span className="text-xs font-normal text-ink-soft">{r.dir}쪽 {r.km}km</span>} />
            ) : (
              <p className={QUIET}>이 거리 안에는 잘 맞는 곳이 없어요. 집 근처에서 쉬어 가세요.</p>
            )}
          </div>
        ))}
        <p className={`mt-2 ${QUIET}`}>
          {me.name}님에게 필요한 {elName(need.yong)} 기운은 {PLACE_KIND[need.yong]} 같은 곳에서 채우기 좋아요. 매주 새로 바뀌어요.
        </p>
      </section>

      <Meet me={me} home={home} all={all} onPick={show} />

      <section className={CARD}>
        <p className={KICKER}>나를 닮은 동네</p>
        <h3 className={H3}>{me.name}님 사주와 땅 모양이 가장 비슷한 곳</h3>
        <Rows list={alike} onPick={show} right={(r) => <span className="text-xs font-normal text-ink-soft">{nickOf(r)}</span>} />
        <p className={`mt-2 ${QUIET}`}>닮은 동네는 마음이 편하지만, 모자란 기운을 채워 주진 않아요. 쉬러 가기 좋은 곳이고, 살기엔 위의 순위가 더 잘 맞아요.</p>
      </section>

      <p className={`mt-5 px-1 ${QUIET}`}>
        땅의 산과 물로 기운을 보는 건 풍수에서 쓰는 생활 방법이에요. 이 점수만으로 이사나 직장을 정하진 마시고, 비슷한 두 곳 중에 고를 때 참고하세요. 행정구역은{" "}
        {MAP.asOf.replace(/-/g, ".")} 기준이에요.
      </p>
    </>
  );
}

function GuaLine({ gua }: { gua: Gua | null }) {
  if (!gua) return <>성별을 넣으면 이사하기 좋은 방향(팔택)까지 같이 봐요.</>;
  return (
    <>
      팔택으로는 {guaLabel(gua)}({gua.east ? "동사명" : "서사명"})라 이사는 <b>{goodStars(gua).map((g) => `${g.dir}쪽`).join(", ")}</b>이 길해요.
    </>
  );
}

const BAR_NAME = ["나무", "불", "흙", "쇠", "물"];
function Picked({ r, all, need, gua, home }: { r: Scored; all: Scored[]; need: Need; gua: Gua | null; home: Region }) {
  const rk = rankOf(all, r.code);
  if (!rk || !r.ground)
    return (
      <p className="mt-3 text-center text-[15px]">
        <b>{label(r)}</b> 이 동네는 땅 정보가 없어요.
      </p>
    );
  const pct = Math.max(1, Math.round((rk.rank / rk.of) * 100));
  const sub = "mt-4 text-xs font-extrabold text-gold";
  return (
    <div className="mt-4 rounded-2xl bg-hanji-deep/30 px-4 py-5">
      <p className="text-center text-[17px]">
        <b>{label(r)}</b> <span className="text-ink-soft">{r.km}km</span>
      </p>
      <p className="mt-1 text-center text-[17px]">
        {rk.of}곳 중 <b className="font-myeongjo text-3xl text-seal">{rk.rank}</b>위 <span className="text-ink-soft">(위에서 {pct}%)</span>
      </p>
      <p className="mt-1 text-center font-myeongjo text-lg font-extrabold text-seal">{nickOf(r)}</p>
      <div className="mt-3 space-y-1.5">
        {r.ground.map((v, e) => {
          const want = e === need.yong || e === need.hee;
          const avoid = e === need.gi;
          return (
            <div key={e} className="flex items-center gap-3">
              <span className={`w-8 text-sm ${want ? "font-extrabold" : ""}`}>{BAR_NAME[e]}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                <span className={`block h-full rounded-full ${want ? "bg-seal" : avoid ? "bg-ink/45" : "bg-seal/30"}`} style={{ width: `${Math.round(v * 100)}%` }} />
              </span>
            </div>
          );
        })}
        <p className={`text-center ${QUIET}`}>빨간 막대는 필요한 기운, 회색 막대는 버거운 기운이에요. 전국 256곳과 견준 세기예요.</p>
      </div>
      <div className="mt-3 space-y-1.5 text-[15px] leading-relaxed">
        {whyOf(r, need).map((l) => (
          <p key={l}>{l}</p>
        ))}
        <DongLine code={r.code} need={need} lead={`${r.name} 안에서는`} />
      </div>
      <p className={sub}>날씨 (30년 평균)</p>
      {weatherOf(r, home).map((l) => (
        <p key={l} className={QUIET}>
          {l}
        </p>
      ))}
      <p className={sub}>이사 방향 점검 ({label(home)}에서)</p>
      {moveCheck(r, need, sajuYear()).map((l) => (
        <p key={l} className={QUIET}>
          {l}
        </p>
      ))}
      {!gua && <p className={QUIET}>성별을 넣으면 팔택 방향까지 같이 봐요.</p>}
    </div>
  );
}

// The best dongs of one 시군구, in a line: "그중에서도 신림동, 서원동, 난곡동 쪽이 가장 잘 맞아요".
function useDongs() {
  const [d, setD] = useState<DongData | null>(null);
  useEffect(() => {
    let live = true;
    loadDongs().then(
      (x) => live && setD(x),
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return d;
}
function DongLine({ code, need, lead }: { code: string; need: Need; lead: string }) {
  const d = useDongs();
  const list = useMemo(() => (d ? dongsOf(code, need, d) : []), [d, code, need]);
  if (list.length < 2) return null;
  const best = list.slice(0, 3);
  return (
    <p className="mt-2 text-left text-[15px] leading-relaxed">
      {lead} <b>{best.map((x) => x.name).join(", ")}</b> 쪽이 가장 잘 맞아요.
      <span className="block text-[13px] text-ink-soft">
        {best[0].name}: {best[0].why}
      </span>
    </p>
  );
}

// 약속 명당: friends' 시군구 (kept only on this screen), the fairest places for everyone, best for my chart among them,
// and the days of the next two weeks good for meeting.
function Meet({ me, home, all, onPick }: { me: Person; home: Region; all: Scored[]; onPick: (r: Scored) => void }) {
  const [friends, setFriends] = useState<Region[]>([]);
  const [sido, setSido] = useState(home.sido);
  const people = useMemo(() => [home, ...friends], [home, friends]);
  const places = useMemo(() => meetPlaces(all, people), [all, people]);
  const days = useMemo(() => meetDays(me), [me]);
  const add = (code: string) => {
    const r = byCode(code);
    if (r && friends.length < 5) setFriends([...friends, r]);
  };
  const text = `우리 약속 장소 후보예요. 다들 오기 공평한 곳으로 골랐어요.\n${places.map((x, i) => `${i + 1}. ${label(x.r)}`).join("\n")}\n날짜는 ${days.map((d) => `${d.date}(${d.weekday})`).join(", ")} 중에 어때요?`;
  return (
    <section className={CARD}>
      <p className={KICKER}>약속 명당</p>
      <h3 className={H3}>모두 오기 공평하고, {me.name}님에게 좋은 약속 장소</h3>
      <p className={QUIET}>같이 만날 사람이 사는 곳을 골라 주세요(5명까지). 고른 곳은 저장하지 않아요.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-hanji-deep px-3 py-1.5 text-sm">나: {home.name}</span>
        {friends.map((f, i) => (
          <button key={f.code + i} type="button" className="rounded-full border border-ink/20 bg-white px-3 py-1.5 text-sm" onClick={() => setFriends(friends.filter((_, j) => j !== i))} aria-label={`${label(f)} 빼기`}>
            {label(f)} ✕
          </button>
        ))}
      </div>
      {friends.length < 5 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select aria-label="친구 시도" className={SELECT} value={sido} onChange={(e) => setSido(e.target.value)}>
            {SIDOS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select aria-label="친구 시군구" className={SELECT} value="" onChange={(e) => add(e.target.value)}>
            <option value="">친구 사는 곳 더하기</option>
            {MAP.regions
              .filter((r) => r.sido === sido)
              .map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
          </select>
        </div>
      )}
      {places.length > 0 && (
        <>
          <Rows list={places.map((x) => x.r)} onPick={onPick} right={(r) => <span className="text-xs font-normal text-ink-soft">가장 먼 사람 {Math.round(places.find((x) => x.r.code === r.code)!.far)}km</span>} />
          <p className={QUIET}>거리는 사는 곳 가운데끼리 잰 직선거리예요. 그중 {me.name}님 기운을 채우는 곳을 앞에 뒀어요.</p>
          <p className="mt-4 text-xs font-extrabold text-gold">만나기 좋은 날 (2주 안)</p>
          {days.map((d) => (
            <p key={d.date} className="mt-1.5 text-[14px] leading-relaxed">
              <b>
                {d.date} ({d.weekday})
              </b>{" "}
              {d.weekend && <span className="rounded-md bg-seal/10 px-1.5 py-0.5 text-xs text-seal">주말</span>} <span className="text-ink-soft">{d.why}</span>
            </p>
          ))}
          <div className="mt-4">
            <ShareLinkButton path="/myeongdang" text={text} label="약속 후보 보내기" event="share_result" />
          </div>
        </>
      )}
    </section>
  );
}
