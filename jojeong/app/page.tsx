import Link from "next/link";
import { cookies } from "next/headers";
import BirthForm from "@/components/BirthForm";
import Naegwan from "@/components/Naegwan";
import { OWNER_PREFIX } from "@/lib/cookies";
import { ROLES } from "@/lib/roles";
import { getCourt, type Court } from "@/lib/store";
import type { RoleKey } from "@/lib/saju";

const SHOWCASE: RoleKey[] = ["yeong", "byeongjo", "hojo", "yejo", "gansin", "yubae"];

async function myCourts() {
  const jar = await cookies();
  const owned = jar
    .getAll()
    .filter((c) => c.name.startsWith(OWNER_PREFIX))
    .slice(0, 3);
  const courts = await Promise.all(owned.map((c) => getCourt(c.name.slice(OWNER_PREFIX.length))));
  return courts.filter((court, i): court is Court => !!court && court.ownerToken === owned[i].value);
}

export default async function Home() {
  const courts = await myCourts();

  return (
    <>
      <header className="animate-rise pt-10 text-center">
        <p className="mx-auto w-fit rounded-full border border-seal/40 px-3 py-1 text-xs font-bold tracking-widest text-seal">
          사주 인사발령
        </p>
        <h1 className="mt-4 font-myeongjo text-5xl font-extrabold tracking-tight">나의 조정</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          생년월일만 넣으면 전하가 되옵니다.
          <br />
          벗들을 부르면 <b className="text-ink">사주가 관직을 내려드리옵니다.</b>
        </p>
      </header>

      <ul className="mt-6 grid grid-cols-3 gap-2">
        {SHOWCASE.map((key) => {
          const role = ROLES[key];
          const danger = role.tone === "red" || role.tone === "gray";
          return (
            <li
              key={key}
              className={`rounded-xl border px-2 py-3 text-center ${danger ? "border-seal/30 bg-seal/5" : "border-ink/10 bg-white/60"}`}
            >
              <p className={`font-myeongjo text-lg font-extrabold ${danger ? "text-seal" : ""}`}>{role.title}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink-soft">{role.tagline}</p>
            </li>
          );
        })}
      </ul>

      {courts.length > 0 && (
        <section className="mt-6 flex flex-col gap-2">
          {courts.map((court) => (
            <Link
              key={court.id}
              href={`/court/${court.id}`}
              className="rounded-2xl border-2 border-gold/60 bg-white/70 px-4 py-3 text-center font-bold"
            >
              {court.kingName} 전하의 조정으로 돌아가기 →
            </Link>
          ))}
        </section>
      )}

      <section className="mt-8">
        <Naegwan>
          전하, 조정이 텅 비었사옵니다. 어서 즉위하시고 벗들을 부르시옵소서. 누가 영의정이고 누가 간신인지 소신이
          사주로 가려드리겠사옵니다.
        </Naegwan>
      </section>

      <section className="mt-5 rounded-3xl border border-ink/10 bg-hanji-deep/60 p-5">
        <BirthForm mode="king" />
      </section>

      <ol className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
        {["즉위하기", "벗들에게 링크 보내기", "관직 발표 & 교지 공유"].map((step, i) => (
          <li key={step} className="flex flex-col items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink font-myeongjo text-sm font-extrabold text-hanji">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="mt-10 text-center text-[11px] text-ink-soft/80">재미로 보는 사주 콘텐츠이옵니다. 진짜 간신은 행동으로 가려내시옵소서.</p>
    </>
  );
}
