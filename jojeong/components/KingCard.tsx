import RoyalDoc from "./RoyalDoc";
import { kingLinkText } from "@/lib/kings";
import { KING_TYPES } from "@/lib/kingTypes";
import type { Pillars } from "@/lib/saju";
import Keep from "./Keep";

export default function KingCard({ kingName, pillars }: { kingName: string; pillars: Pillars }) {
  const type = KING_TYPES[pillars.dayStem];
  const { link, headline } = kingLinkText(pillars);
  const shown = link.kind === "none" ? [] : link.kings.slice(0, 3);
  const rest = link.kind === "none" ? 0 : link.kings.length - shown.length;

  return (
    <RoyalDoc paperClassName="px-5">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">卽 位 敎 書</p>
      <p className="mt-4 text-center text-sm text-ink-soft">{kingName} 전하는</p>
      <p className="mt-1 text-center font-myeongjo text-4xl font-extrabold">{type.title}</p>
      <p className="mt-1.5 text-center text-xs font-bold text-gold">{type.symbol}</p>
      <p className="mt-3 text-center text-[15px]">&ldquo;{type.tagline}&rdquo;</p>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{type.style}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          ["강점", type.strength],
          ["약점", type.weakness],
          ["곁에 둘 신하", type.keep],
          ["경계할 신하", type.beware],
        ].map(([k, v]) => (
          <div key={k} className="border border-seal/20 px-3 py-2">
            <dt className={`text-xs font-bold ${k === "경계할 신하" || k === "약점" ? "text-seal" : "text-gold"}`}>{k}</dt>
            <dd className="mt-0.5 leading-snug">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-y-[3px] border-double border-seal/40 px-1 py-3">
        <p className="text-sm font-extrabold text-seal">{headline}</p>
        {link.kind === "none" ? (
          <p className="mt-1 text-sm leading-relaxed">전하께서 이 기운을 타고난 최초의 군주이옵니다.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {shown.map((k) => (
              <li key={k.name} className="flex items-baseline gap-2 text-sm">
                <b className="shrink-0 font-myeongjo text-base">{k.name}</b>
                <span className="text-ink-soft">
                  <Keep>{k.note}</Keep>
                </span>
              </li>
            ))}
            {rest > 0 && <li className="text-xs text-ink-soft">외 {rest}명</li>}
          </ul>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-soft/80">왕들의 사주는 실록에 남은 음력 탄일로 계산했사옵니다.</p>
    </RoyalDoc>
  );
}
