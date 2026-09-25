import { KING_AVG_LIFESPAN, sillok } from "@/lib/sillok";
import type { Pillars } from "@/lib/saju";

function Entry({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-ink/10 py-3.5 first:border-t-0 first:pt-0">
      <p className="text-xs font-extrabold tracking-wider text-seal">{label}</p>
      <div className="mt-1 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export default function Sillok({ kingName, pillars }: { kingName: string; pillars: Pillars }) {
  const s = sillok(pillars);
  return (
    <section className="mt-6 rounded-3xl border border-ink/15 bg-[#fbf6ea] px-5 pt-6 pb-5 shadow-sm">
      <p className="text-center font-myeongjo text-sm font-extrabold tracking-[0.3em] text-seal">假 想 實 錄</p>
      <h2 className="mt-2 text-center font-myeongjo text-2xl font-extrabold">{kingName} 전하의 가상 실록</h2>
      <p className="mt-1 text-center text-xs text-ink-soft">전하의 사주로 지어 올린 가상의 기록이옵니다</p>

      <div className="mt-5">
        <Entry label="존호(尊號)">
          훗날 신하들이 올린 존호는 <b className="font-myeongjo text-lg">{s.epithet}</b>이다.
        </Entry>
        <Entry label="즉위와 천수">
          <b>{s.accession}세</b>에 즉위하여 <b>{s.reign}년</b>간 나라를 다스렸고, <b>향년 {s.death}세</b>로
          승하하였다. {s.lifespanNote}
        </Entry>
        <Entry label={`시대상 · ${s.era.title}`}>{s.era.text}</Entry>
        <Entry label="사관의 평">
          <p className="font-myeongjo">&ldquo;{s.sagwan}&rdquo;</p>
        </Entry>
        <Entry label="신하들이 부른 별명">
          조정에서는 뒤에서 몰래 <b>&lsquo;{s.nickname}&rsquo;</b>라 불렀다. {s.nicknameWhy}이다.
        </Entry>
        <Entry label="민심">
          백성들은 <b>&lsquo;{s.peopleName}&rsquo;</b>이라 불렀다. {s.rumor}
        </Entry>
        <Entry label="3대 업적">
          <ol className="flex flex-col gap-1">
            {s.deeds.map((d, i) => (
              <li key={d}>
                <span className="mr-1.5 font-myeongjo font-extrabold text-gold">{"一二三"[i]}</span>
                {d}
              </li>
            ))}
          </ol>
        </Entry>
        <Entry label="흑역사">{s.blooper}</Entry>
        <Entry label="최대 위기">{s.crisis}</Entry>
      </div>

      <p className="mt-3 text-right font-myeongjo text-sm text-ink-soft">— 관상감 명과학 훈도 정가, 삼가 적음</p>
      <p className="mt-3 text-center text-[11px] text-ink-soft/80">
        실제 조선 왕 27명의 평균 수명은 {KING_AVG_LIFESPAN}세, 가장 장수한 왕은 영조(82세)였사옵니다.
      </p>
    </section>
  );
}
