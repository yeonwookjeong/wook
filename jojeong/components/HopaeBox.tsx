import HopaeFace from "./HopaeFace";
import HopaeBoxSend from "./HopaeBoxSend";
import { NIGHT_GOLD, NIGHT_PANEL } from "./SinsalNight";
import { MATERIAL, TAG_ORDER, yearGanji, type TagKind } from "@/lib/hopae";
import { IN100, RARE } from "@/lib/hopaeShare";
import type { HungTag } from "@/lib/store";

// 호패함, under the reader's own 호패: five hooks, one per tag of 『속대전』, with the reader's and every friend's who
// came in through their link. Empty hooks say how rare their tag is, so there is always one worth asking for.
export default function HopaeBox({ me, friends, path, text }: { me: { name: string; job: string; kind: TagKind }; friends: HungTag[]; path: string; text: string }) {
  const all = [{ n: me.name, j: me.job, t: me.kind, self: true }, ...friends.map((f) => ({ n: f.n, j: f.j, t: f.t as TagKind, self: false }))];
  const on = (k: TagKind) => all.filter((x) => x.t === k);
  const filled = TAG_ORDER.filter((k) => on(k).length).length;
  const wanted = RARE.find((k) => !on(k).length);
  const rareHung = friends.find((f) => RARE.includes(f.t as TagKind));
  return (
    <section className={`${NIGHT_PANEL} mt-5 px-3 pt-4 pb-4`}>
      <h2 className="text-center font-myeongjo text-[18px] font-extrabold">{me.name}의 호패함</h2>
      <p className="mt-1 text-center text-[12.5px] text-hanji/70">
        {friends.length ? `친구 ${friends.length}명의 호패가 걸렸사옵니다. 다섯 가지 중 ${filled}가지` : "아직 그대 호패 하나뿐이옵니다"}
      </p>
      {rareHung && (
        <p className={`mt-2 text-center text-[13px] font-bold ${NIGHT_GOLD}`}>
          드문 호패가 걸렸사옵니다. {rareHung.n}의 {MATERIAL[rareHung.t as TagKind].what} 호패, 100명 중 {IN100[rareHung.t as TagKind]}명
        </p>
      )}
      <ul className="mt-3 grid grid-cols-5 items-start gap-1">
        {TAG_ORDER.map((k, i) => {
          const here = on(k);
          return (
            <li key={k} className="flex flex-col items-center">
              <div className={`w-full ${here.length ? "" : "opacity-25 grayscale"}`}>
                <HopaeFace tag={{ kind: k, job: here[0]?.j.split(" ").pop() ?? "", born: "", issued: yearGanji() }} id={`box-${i}`} />
              </div>
              <p className="mt-1 text-[12px] font-bold">{MATERIAL[k].what}</p>
              {here.length ? (
                <ul className="mt-0.5 flex flex-col items-center gap-0.5">
                  {here.slice(0, 4).map((x, j) => (
                    <li key={j} className={`max-w-full truncate rounded-full px-1.5 text-[10.5px] ${x.self ? "bg-[#d4af5f] font-bold text-[#0f2236]" : "bg-white/10 text-hanji/90"}`}>
                      {x.n}
                    </li>
                  ))}
                  {here.length > 4 && <li className="text-[10px] text-hanji/60">외 {here.length - 4}명</li>}
                </ul>
              ) : (
                <p className="text-[10.5px] text-hanji/45">100명 중 {IN100[k]}</p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-[13px] leading-relaxed text-hanji/85">
        {wanted ? (
          <>
            그대 무리에 <b className={NIGHT_GOLD}>{MATERIAL[wanted].what} 호패</b>가 있을까요?
            <br />
            친구 10명이면 {wanted === "아패" ? "반반" : "넷 중 하나"}이옵니다.
          </>
        ) : (
          "상아도 큰 나무도 다 걸렸사옵니다. 보기 드문 무리이옵니다."
        )}
      </p>
      <HopaeBoxSend path={path} text={text} />
      <p className="mt-2 text-center text-[11.5px] leading-relaxed text-hanji/55">
        링크를 받은 친구가 생일을 넣으면 그 호패가 여기 걸리고, 둘이 조선에서 무슨 사이였는지 나와요. 생일은 저장하지 않아요.
      </p>
    </section>
  );
}
