import { openURL, Share } from "@apps-in-toss/web-framework";
import { useEffect, useMemo, useState } from "react";
import type { Person } from "@/lib/pairToken";
import { makeupOf, per100, rareText, sinsalOf, type Card } from "@/lib/sinsal";
import { moreOf } from "@/lib/sinsalMore";
import { addToList, readList } from "@common/me";
import { TossBanner } from "@common/TossBanner";
import { useRewardedAd } from "@common/useRewardedAd";
import { pictureOf } from "./pictures";

const OPEN_KEY = "sinsal:opened";
// Where the share link and the report button lead: the two mini apps' names in the Apps in Toss console.
const SELF = "intoss://hundo-sinsal";
const MAIN = "intoss://hundo-saju";
// "만 가진" only for the rarer ones: one in five or more is common, not a boast.
const held = (c: Card) => `${rareText(c)}${per100(c.id) < 20 ? "만" : "이"} 가진 살`;

function CardFace({ card, me, big }: { card: Card; me: Person; big?: boolean }) {
  const src = pictureOf(card, me.gender);
  return (
    <div className={big ? "face big" : "face"}>
      {src && <img src={src} alt="" />}
      <div>
        <p className="kicker">
          {card.sal} · {card.hanja}
        </p>
        <h2>{card.nick}</h2>
        <p>{card.line}</p>
        <p className="rare">{held(card)}</p>
      </div>
    </div>
  );
}

// The reading: the chart's rarest 신살 as its card, free; the rest of the chart's 신살 and how they share it open
// with one rewarded ad (kept for this chart on this phone).
export function Result({ me, onAgain }: { me: Person; onAgain: () => void }) {
  const r = useMemo(() => sinsalOf(me.pillars), [me]);
  const all = useMemo(() => [r.head, ...r.rest], [r]);
  const makeup = useMemo(() => makeupOf(me.pillars, all), [me, all]);
  const more = r.head.id === "musal" ? null : moreOf(r.head.id);
  const chartKey = JSON.stringify(me.pillars);
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [shared, setShared] = useState<string | null>(null);

  useEffect(() => {
    readList(OPEN_KEY).then((keys) => setOpen(keys.includes(chartKey)));
  }, [chartKey]);
  const unlock = () => {
    setOpen(true);
    void addToList(OPEN_KEY, chartKey, 20);
  };
  const ad = useRewardedAd(unlock);

  async function share() {
    const text = `나는 '${r.head.nick}' ${r.head.sal}! ${held(r.head)}이래. 너는 무슨 살이야?`;
    try {
      const link = await Share.createLink({ path: SELF });
      await Share.sendMessage({ message: `${text}\n${link}` });
    } catch {
      setShared("공유는 토스 앱 안에서 할 수 있어요.");
    }
  }

  return (
    <section className="stack">
      <div className="card">
        <p className="kicker">{me.name}님 사주의 대표 신살</p>
        <CardFace card={r.head} me={me} big />
        <p className="quiet">{r.summary}</p>
        <p>{r.head.body}</p>
        {more && (
          <>
            <button className="link inline" onClick={() => setShowMore(!showMore)}>
              {showMore ? "접기" : "이 살, 더 알아보기"}
            </button>
            {showMore && (
              <div className="more">
                <p>
                  <strong>잘 쓰일 때</strong> {more.good}
                </p>
                <p>
                  <strong>조심할 때</strong> {more.care}
                </p>
                <p>
                  <strong>일</strong> {more.life[0]} · <strong>사랑</strong> {more.life[1]} · <strong>돈</strong> {more.life[2]}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <button className="primary" onClick={share}>
        친구에게 내 살 자랑하기
      </button>
      {shared && <p className="quiet small center">{shared}</p>}

      {r.rest.length > 0 &&
        (open ? (
          <div className="card">
            <h3>내 사주의 신살 {r.kinds}가지</h3>
            <div className="makeup">
              {makeup.map((m) => (
                <div key={m.card.id} className="makeup-row">
                  <span>{m.card.sal}</span>
                  <span className="track">
                    <span style={{ width: `${m.pct}%` }} />
                  </span>
                  <span>{m.pct}%</span>
                </div>
              ))}
            </div>
            {r.rest.map((c) => (
              <div key={c.id} className="rest">
                <CardFace card={c} me={me} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card locked">
            <h3>숨은 신살이 {r.rest.length}개 더 있어요</h3>
            <p className="quiet">{r.rest.map(() => "▢").join(" ")}</p>
            {ad.state === "unavailable" ? (
              <button className="primary" onClick={unlock}>
                숨은 신살 보기
              </button>
            ) : (
              <button className="primary" onClick={ad.show} disabled={ad.state !== "ready"}>
                {ad.state === "ready" ? "광고 보고 숨은 신살 보기" : "광고 준비 중…"}
              </button>
            )}
          </div>
        ))}

      <div className="card">
        <h3>이 살들이 내 인생에서 어떻게 움직일까?</h3>
        <p className="quiet">정 훈도가 {me.name}님 사주 전체를 보고 성격·돈·일·사랑을 한 권으로 풀어 드려요.</p>
        <button className="secondary" onClick={() => openURL(MAIN).catch(() => {})}>
          훈도사주에서 평생 사주 보기
        </button>
      </div>

      <button className="link" onClick={onAgain}>
        다른 생일로 보기
      </button>
      <p className="quiet small center">사주 풀이는 재미와 참고를 위한 것이에요.</p>
      {/* Last on the page, away from every button (the ad policy). */}
      <TossBanner />
    </section>
  );
}
