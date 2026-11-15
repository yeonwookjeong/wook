import { useMemo } from "react";
import { salsAt, type Sal } from "@/lib/deep";
import type { Person } from "@/lib/pairToken";
import { BRANCHES, BRANCHES_KO } from "@/lib/saju";
import { cardsOf, heldOf } from "@/lib/sinsal";
import { dayPillar } from "@/lib/today";
import { josa } from "@/lib/josa";

// 오늘의 신살: which 신살 the day's branch wakes in this chart (lib/deep.ts salsAt, the same tables as the card),
// so the app has something new every day, and tomorrow's is named to bring the reader back.
const TODAY: Record<Sal, string> = {
  천을귀인: "귀인이 드는 날이에요. 막히는 일이 있으면 혼자 버티지 말고 도움을 청해 보세요.",
  문창귀인: "글과 말이 잘 풀리는 날이에요. 미뤄 둔 정리, 공부, 기획서를 꺼내 보세요.",
  도화: "매력이 도는 날이에요. 사람 만나는 약속, 첫인상이 중요한 일에 좋아요.",
  역마: "움직일수록 풀리는 날이에요. 외근, 이동, 처음 가 보는 곳이 운을 열어요.",
  화개: "혼자 깊어지는 날이에요. 혼자 하는 작업, 취미, 공부에 집중해 보세요.",
  양인: "추진력이 센 날이에요. 결단은 좋지만 말다툼과 과속은 조심하세요.",
  공망: "애쓴 만큼 손에 잡히지 않는 날이에요. 큰 결정은 미루고 실속을 챙기세요.",
};
// The card ids of the 살 a chart holds, by the names salsAt gives (공망 has no card: most charts hold it).
const ID: Partial<Record<Sal, string>> = { 천을귀인: "cheoneul", 문창귀인: "munchang", 도화: "dohwa", 역마: "yeokma", 화개: "hwagae", 양인: "yangin" };

function dayOf(offset: number) {
  const kst = new Date(Date.now() + 9 * 3600000 + offset * 86400000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  return { label: `${m}월 ${d}일`, ...dayPillar(y, m, d) };
}

export function TodaySinsal({ me }: { me: Person }) {
  const { today, tomorrow, sals, next, owned } = useMemo(() => {
    const today = dayOf(0);
    const tomorrow = dayOf(1);
    const held = new Set(cardsOf(heldOf(me.pillars)).map((id) => id.replace(/\d$/, "")));
    return {
      today,
      tomorrow,
      sals: salsAt(me.pillars, today.branch),
      next: salsAt(me.pillars, tomorrow.branch),
      owned: (s: Sal) => Boolean(ID[s] && held.has(ID[s]!)),
    };
  }, [me]);

  return (
    <div className="card today">
      <p className="kicker">
        {today.label} · {BRANCHES[today.branch]}({BRANCHES_KO[today.branch]})일
      </p>
      <h3>{sals.length ? `오늘 ${me.name}님에게 깨어나는 살: ${sals.join(", ")}` : `오늘은 ${me.name}님의 살이 조용한 날`}</h3>
      {sals.length ? (
        sals.map((s) => (
          <p key={s}>
            <strong>{s}</strong> {owned(s) ? "(내 사주에도 있는 살) " : ""}
            {TODAY[s]}
          </p>
        ))
      ) : (
        <p>평소 하던 대로 하면 무난한 날이에요. 새로 벌이기보다 하던 일을 마무리하기 좋아요.</p>
      )}
      <p className="quiet small">
        내일({tomorrow.label})은 {next.length ? `${josa(next.join(", "), "이/가")} 찾아와요.` : "살이 조용한 날이에요."} 내일 다시 열면 풀이를 볼 수
        있어요.
      </p>
    </div>
  );
}
