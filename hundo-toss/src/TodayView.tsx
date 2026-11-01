import { useEffect, useMemo, useState } from "react";
import type { Person } from "@/lib/pairToken";
import { todayFor } from "@/lib/today";
import { addToList, readList } from "./me";
import { useRewardedAd } from "./useRewardedAd";

const UNLOCK_KEY = "hundo:unlocked";
const kstDay = (now = new Date()) => new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
const stars = (n: number) => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));

// 오늘의 운세: the day's score and its best side for free; the four areas, the good hour, the lucky colour, the
// week and the hard-day advice open with one rewarded ad, for the rest of the day.
export function TodayView({ me }: { me: Person }) {
  const today = useMemo(() => todayFor(me), [me]);
  const day = kstDay();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    readList(UNLOCK_KEY).then((days) => setOpen(days.includes(day)));
  }, [day]);
  const unlock = () => {
    setOpen(true);
    void addToList(UNLOCK_KEY, day, 7);
  };
  const ad = useRewardedAd(unlock);

  return (
    <section className="stack">
      <div className="card">
        <p className="kicker">
          {today.date} · {today.gz}
        </p>
        <h2>{me.name}님의 오늘</h2>
        {today.score !== null && (
          <p className="score">
            <strong>{today.score}</strong>점
          </p>
        )}
        {today.best && (
          <p>
            오늘 가장 좋은 쪽: <strong>{today.best.label}</strong> <span className="stars">{stars(today.best.stars)}</span>
          </p>
        )}
        {today.personal && <p>{today.personal}</p>}
        <p className="quiet">{today.advice}</p>
      </div>

      {open ? (
        <div className="card">
          <h3>오늘의 자세한 풀이</h3>
          {today.areas?.map((a) => (
            <div key={a.key} className="area">
              <p>
                <strong>{a.label}</strong> <span className="stars">{stars(a.stars)}</span>
              </p>
              <p>{a.line}</p>
            </div>
          ))}
          {today.hour && (
            <p>
              <strong>좋은 시간</strong> {today.hour.label} · {today.hour.why}
            </p>
          )}
          {today.lucky && (
            <p>
              <strong>행운</strong> 색 {today.lucky.color} · 방향 {today.lucky.direction}
            </p>
          )}
          {today.watch && (
            <div className="watch">
              <p>
                <strong>피할 것</strong> {today.watch.avoid}
              </p>
              <p>
                <strong>대신 할 것</strong> {today.watch.prep}
              </p>
              <p>
                <strong>그래도 좋은 것</strong> {today.watch.bright}
              </p>
              {today.watch.next && (
                <p>
                  <strong>다음 좋은 날</strong> {today.watch.next}
                </p>
              )}
            </div>
          )}
          {today.week && (
            <div className="week">
              {today.week.map((w) => (
                <span key={w.date} className={w.today ? "on" : undefined}>
                  {w.day}
                  <br />
                  {w.mark}
                </span>
              ))}
            </div>
          )}
          {today.hundo && <p className="hundo">“{today.hundo}”</p>}
        </div>
      ) : (
        <div className="card locked">
          <h3>오늘의 자세한 풀이</h3>
          <p className="quiet">돈·일·사랑·건강, 좋은 시간과 행운의 색, 이번 주 흐름까지</p>
          {ad.state === "unavailable" ? (
            <button className="primary" onClick={unlock}>
              자세히 보기
            </button>
          ) : (
            <button className="primary" onClick={ad.show} disabled={ad.state !== "ready"}>
              {ad.state === "ready" ? "광고 보고 자세히 보기" : "광고 준비 중…"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
