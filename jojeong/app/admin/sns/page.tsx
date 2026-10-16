import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { Card } from "../cards/Card";
import CardSaver from "./CardSaver";
import { Solar } from "lunar-javascript";
import { jiaziNo } from "@/lib/cards";
import { BRANCHES, BRANCHES_KO, STEMS, STEMS_KO } from "@/lib/saju";

export const metadata: Metadata = { title: "SNS 카드", robots: { index: false } };

// What to post, when, and how it did all live in one place: the 훈도 콘텐츠 데스크 (a claude.ai artifact the owner
// and Claude both edit). This page only draws the cards that need the site's own data (the soft opening's real
// count, this month's ranking) so they can be saved as PNGs and put on the desk.
const DESK = "https://claude.ai/artifact/3MfTn2joJy1wveJEjvYhFb";

const SCALE = 0.3;

function sets(): { name: string; note?: string; list: string[]; kind: "card" | "reel" }[] {
  const now = new Date(Date.now() + 9 * 3600000);
  const [y, m] = [now.getUTCFullYear(), now.getUTCMonth() + 1];
  return [
    { name: "정식 오픈", note: "2장째에 가오픈 동안의 실제 횟수가 들어가요 (100번 이상일 때)", list: ["c=open-cover", "c=open-thanks", "c=open-new", "c=cta&who=saju"], kind: "card" },
    { name: `${m}월 60일주 랭킹 릴스`, note: "절기가 바뀌는 날 기준의 달", list: [`c=rank-reel&y=${y}&m=${m}`], kind: "reel" },
    ...dogam(),
  ];
}

// The 60일주 도감 carousel for today and the next six days: each day's own pillar (표지 · 풀이 · 끝장), so the
// owner saves that day's three slides and posts them without asking for them.
function dogam() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + 9 * 3600000 + i * 86400000);
    const l = Solar.fromYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()).getLunar();
    const s = (STEMS as readonly string[]).indexOf(l.getDayGan());
    const b = (BRANCHES as readonly string[]).indexOf(l.getDayZhi());
    const day = `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${"일월화수목금토"[d.getUTCDay()]})`;
    return {
      name: `${i === 0 ? "오늘 · " : ""}${day} 60일주 도감 No.${jiaziNo(s, b)} · ${STEMS_KO[s]}${BRANCHES_KO[b]}일주`,
      note: i === 0 ? "그날 아침 스레드 도감 글과 같은 일주예요. 세 장을 저장해 인스타 캐러셀로" : undefined,
      list: [`c=ilju-cover&s=${s}&b=${b}`, `c=ilju&s=${s}&b=${b}`, "c=cta&who=saju"],
      kind: "card" as const,
    };
  });
}

function Slides({ name, list, kind }: { name: string; list: string[]; kind: "card" | "reel" }) {
  const h = kind === "reel" ? 1920 : 1440;
  const scale = kind === "reel" ? 0.26 : SCALE;
  return (
    <div className="mt-3">
      <CardSaver date={name} count={list.length} kind={kind}>
        {list.map((qs, i) => (
          <div key={i} className="relative shrink-0 snap-start overflow-hidden rounded-md border border-seal/20" style={{ width: 1080 * scale, height: h * scale }}>
            <div style={{ width: 1080, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", position: "relative" }}>
              <Card q={Object.fromEntries(new URLSearchParams(qs))} />
            </div>
            <span className="absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 text-[11px] font-bold text-white">{i + 1}</span>
          </div>
        ))}
      </CardSaver>
    </div>
  );
}

export default async function SnsPage() {
  if (!(await isAdmin())) redirect("/admin");
  return (
    <>
      <section className="mt-6 text-center">
        <p className="text-xs">
          <Link href="/admin" className="text-seal underline">
            ← 관리자
          </Link>
        </p>
        <h1 className="mt-1 font-myeongjo text-2xl font-extrabold">SNS 카드</h1>
        <p className="mt-1 text-[12px] text-ink-soft">사이트 데이터가 들어가는 카드만 여기서 그려요</p>
      </section>

      <a href={DESK} target="_blank" rel="noopener" className="mt-4 block rounded-2xl bg-seal px-4 py-4 text-center text-white">
        <b className="font-myeongjo text-[17px]">올릴 글은 콘텐츠 데스크에서 →</b>
        <span className="mt-1 block text-[12px] text-white/85">날짜별 원고 · 승인 · 올림 · 성적이 모두 데스크에 있어요</span>
      </a>

      {sets().map((s) => (
        <section key={s.name} className="doc-paper mt-4 px-4 py-4">
          <h2 className="font-myeongjo font-extrabold">{s.name}</h2>
          {s.note && <p className="mt-1 text-[11px] text-ink-soft">{s.note}</p>}
          <Slides name={s.name} list={s.list} kind={s.kind} />
        </section>
      ))}

      <p className="mt-4 text-center text-[12px] text-ink-soft">
        다른 카드는{" "}
        <Link href="/admin/cards" className="text-seal underline">
          카드 만들기
        </Link>
        에서 주소(?c=…)로 그려요
      </p>
    </>
  );
}
