import type { Metadata } from "next";
import Image from "next/image";
import AdSlot from "@/components/AdSlot";
import MeForm from "@/components/MeForm";
import NextStep from "@/components/NextStep";
import { readMe } from "@/lib/me";
import { STEPS } from "@/lib/nextStep";
import { CARDS, imageOf, MUSAL, per100, sinsalOf, type Card } from "@/lib/sinsal";

export const metadata: Metadata = {
  title: "신살 감정 · 내 사주에 적힌 살",
  description: "천을귀인, 도화, 역마, 화개, 양인, 괴강, 백호, 귀문관, 홍염. 내 사주에 어떤 신살이 몇 개 있는지, 그중 가장 드문 살과 그 캐릭터를 보여 드려요.",
};

const howRare = (c: Card) => {
  const n = per100(c.id);
  return n >= 1 ? `100명 중 약 ${Math.round(n)}명` : `1,000명 중 약 ${Math.max(1, Math.round(n * 10))}명`;
};

// Free, rule-based (lib/sinsal.ts): the rarest 신살 the chart holds heads the card with its character, then the rest.
export default async function SinsalPage() {
  const me = await readMe();

  if (!me)
    return (
      <>
        <Header />
        <section className="doc-paper mt-4 px-5 pt-6 pb-6">
          <p className="text-center text-sm leading-relaxed text-ink-soft">
            생년월일을 넣으면 내 사주에 적힌 신살과,
            <br />그중 가장 드문 살의 캐릭터를 보여 드려요.
          </p>
          <div className="mt-4">
            <MeForm next="/sinsal" submit="내 신살 보기" />
          </div>
        </section>
        <Gallery />
      </>
    );

  const gender = me.person.gender === "f" ? "f" : me.person.gender === "m" ? "m" : null;
  const { head, rest, kinds, cells, summary } = sinsalOf(me.person.pillars);
  const noHour = me.person.pillars.hourBranch === null;

  return (
    <>
      <Header />
      <section className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-center">
        <p className="text-[15px] font-extrabold">
          {me.person.name}님 사주에 적힌 살: {kinds ? `${kinds}가지 · ${cells}칸` : "없음"}
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">{summary}</p>
      </section>
      <section className="doc-paper mt-4 overflow-hidden">
        <Image src={imageOf(head, gender)} alt={`${head.sal} · ${head.nick}`} width={800} height={1000} priority className="h-auto w-full" />
        <div className="px-5 pt-5 pb-6 text-center">
          <p className="text-xs font-extrabold text-seal">{kinds ? `${me.person.name}님의 사주에서 가장 드문 살` : `${me.person.name}님의 사주`}</p>
          <p className="mt-2 font-myeongjo text-sm tracking-[0.3em] text-ink-soft">{head.hanja}</p>
          <h2 className="mt-1 font-myeongjo text-2xl font-extrabold">
            {head.sal} · {head.nick}
          </h2>
          <p className="mt-1 text-[15px] font-bold">{head.line}</p>
          <p className="mt-2 inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-bold">{howRare(head)}</p>
          <p className="mt-4 text-left text-[14px] leading-relaxed">{head.body}</p>
        </div>
      </section>

      {rest.length > 0 && (
        <section className="doc-paper mt-5 px-5 py-5">
          <h2 className="font-myeongjo text-lg font-extrabold">그 밖에 적힌 살</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {rest.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <Image src={imageOf(c, gender)} alt={c.nick} width={64} height={80} className="h-20 w-16 shrink-0 rounded-md object-cover" />
                <div className="min-w-0">
                  <p className="font-bold">
                    {c.sal} · {c.nick}
                  </p>
                  <p className="text-[13px] text-ink-soft">{c.line}</p>
                  <p className="text-[12px] text-ink-soft">{howRare(c)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="doc-paper mt-5 px-5 py-5 text-[13px] leading-relaxed text-ink-soft">
        <p>
          신살은 여덟 글자 위에 얹힌 양념 같은 표시예요. 같은 살도 다른 칸과 어떻게 어울리느냐에 따라 결이 달라져요.
          {noHour && " 태어난 시를 모르면 그 칸은 빼고 봤어요."}
        </p>
        <p className="mt-2">드문 정도는 1950~2008년에 태어난 25만 8,600개 사주를 모두 세어 낸 숫자예요.</p>
      </section>

      <NextStep from="sinsal" steps={STEPS.sinsal()} />
      <AdSlot />
    </>
  );
}

function Header() {
  return (
    <section className="mt-6 text-center">
      <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">神 煞</p>
      <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">신살 감정</h1>
      <p className="mt-2 text-[15px] leading-relaxed">내 사주에 적힌 살, 그리고 그 살의 얼굴</p>
      <p className="mt-1 text-xs text-ink-soft">무료 · 20가지 살 캐릭터</p>
    </section>
  );
}

// Before the chart: every character, small, so the visitor sees what can come out.
function Gallery() {
  return (
    <section className="doc-paper mt-5 px-4 py-5">
      <h2 className="text-center font-myeongjo text-lg font-extrabold">나올 수 있는 20가지 살</h2>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {[...CARDS, MUSAL].map((c, i) => (
          <li key={c.id} className="text-center">
            <Image src={imageOf(c, i % 2 ? "f" : "m")} alt={c.nick} width={200} height={250} className="h-auto w-full rounded-md" />
            <p className="mt-1 text-[12px] font-bold leading-tight">{c.sal}</p>
            <p className="text-[11px] leading-tight text-ink-soft">{c.nick}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
