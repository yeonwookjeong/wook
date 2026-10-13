import type { Metadata } from "next";
import Link from "next/link";
import PayButton from "@/components/PayButton";
import { iljuOf, loadRoom, personOfRoom } from "@/lib/ask";
import { ASK_OPEN, currentMember, JOIN_GIFT, memberNo, membersEnabled, viaEnabled } from "@/lib/members";
import { CREDIT_PACKS, type CreditPack } from "@/lib/products";
import { OpenRoomForm } from "./AskForms";
import DraftReturn from "./DraftReturn";
import { openMyRoomAction } from "./actions";
import { readMe } from "@/lib/me";
import { AnswerLetter, HundoFace, Question } from "./Letter";
import { GOLD_BUTTON, Hall, Plaque } from "./Hall";

export const metadata: Metadata = {
  title: "정 훈도에게 묻기",
  // Out of search until it opens (lib/members.ts ASK_OPEN).
  ...(!ASK_OPEN && { robots: { index: false } }),
  description: "내 사주를 펼쳐 놓고 정 훈도에게 고민 하나를 여쭈어 보세요. 카카오로 로그인하면 처음 한 번 질문 1개를 드려요.",
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// What a letter looks like, before signing in: a made-up guest, marked 예시, in the five parts he writes.
const SAMPLE_Q = "이직 제안을 받았는데 이번 달 안에 답해야 해요. 가도 될까요?";
const SAMPLE = `[[直答|가되, 서두르지 말 것]] 좋은 자리를 앞에 두고 마음이 바쁘시겠사옵니다. 바로 아뢰자면, ==가셔도 좋은 길이나, 답은 입동 지나 하시는 편이 이롭사옵니다.==
[[時勢|올해 자리가 들썩인 까닭]] 그대 사주의 일터 자리에 올해의 기운이 부딪쳐, 머물던 자리가 좁게 느껴지는 해이옵니다. 제안이 들어온 것도 우연이 아니라 그 흐름이옵니다.
[[性情|확신이 서야 움직이는 사람]] 그대는 한번 정하면 끝까지 가는 분이라, 시작 전에 오래 재십니다. 그 신중함이 이번엔 조건을 더 받아 내는 힘이 되옵니다.
[[時運|11월, 조건이 풀리는 달]] 한로(10월 8일)부터 입동 전까지는 말이 엇갈리기 쉬우니 서명은 미루시고, 입동(11월 7일) 뒤에 연봉과 역할을 다시 짚으시옵소서. 급하게 오늘 답하라는 쪽은 피하시옵소서.
[[一事|물어볼 것 세 가지 적기]] 오늘은 새 자리에 꼭 확인할 것 세 가지만 적어 두시옵소서. 그대는 이미 고를 수 있는 사람이옵니다.`;

// 청심당's own page: the hall's door. Before signing in, what he gives and a letter to see; signed in, the
// questions left, the rooms, and the questions to buy, all in the hall's night blue and gold (app/ask/Hall.tsx).
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const q = await searchParams;
  const member = membersEnabled() ? await currentMember() : null;
  const me = member ? await readMe() : null;
  const rooms = member ? (await Promise.all(member.rooms.map(loadRoom))).filter((r) => r && r.member === member.id) : [];
  const quick = Boolean(me?.person.gender) && !rooms.some((r) => r!.me === me!.token);
  // With Naver or Google on, the button goes to the choice of ways (app/login); Kakao alone, it says so.
  const others = viaEnabled("naver") || viaEnabled("google");
  const login = others ? "로그인하고 질문 1개 받기" : "카카오로 로그인하고 질문 1개 받기";
  const latest = [...rooms].sort((a, b) => b!.updatedAt - a!.updatedAt)[0];

  if (!membersEnabled()) return <p className="doc-paper mt-6 px-5 py-5 text-center text-sm">곧 열려요. 조금만 기다려 주세요.</p>;

  if (!member)
    return (
      <>
        <Hall className="mt-5 pt-5">
          <Plaque />
          <div className="mt-5 flex items-center gap-3 border-t border-[#e2bc68]/15 pt-4">
            <HundoFace size={52} />
            <h1 className="font-myeongjo text-[19px] leading-snug font-extrabold">
              그대의 여덟 글자를 펼쳐 두고,
              <br />
              <span className="text-[#e2bc68]">고민 하나에 답서를 써 드리옵니다</span>
            </h1>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-[#e2bc68]/15 border-y border-[#e2bc68]/20 text-[13.5px] leading-snug">
            {[
              ["直答", "된다, 안 된다부터 돌려 말하지 않아요"],
              ["圖表", "내 사주표와 다가올 달을 그림으로 짚어 드려요"],
              ["記憶", "다음에 오면 지난 이야기부터 기억해요"],
            ].map(([h, t]) => (
              <li key={h} className="flex items-center gap-3 py-2">
                <span className="w-9 shrink-0 font-myeongjo text-[13px] font-bold text-[#e2bc68]">{h}</span>
                <span className="text-hanji/85">{t}</span>
              </li>
            ))}
          </ul>
          {(q.login === "fail" || q.login === "again") && (
            <p role="alert" className="mt-4 rounded-xl bg-seal/30 px-3 py-2 text-center text-sm">
              로그인이 끝나지 않았어요. 다시 해 주세요.
            </p>
          )}
          <Link href="/login?next=/ask" className={`mt-5 ${GOLD_BUTTON}`}>
            {login}
          </Link>
          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-hanji/60">
            묻는 건 로그인한 분만 할 수 있어요. 질문과 상담 기록을 계정에 보관해, 다음에 와도 이어서 이야기하려고요.
            <br />
            받는 정보는 회원 번호와 별명뿐, 생년월일은 저장하지 않아요.
          </p>
        </Hall>

        <h2 className="mt-8 text-center font-myeongjo text-lg font-extrabold">이런 답서를 받아요</h2>
        <p className="mt-1 text-center text-[12px] text-ink-soft">예시예요 · 실제 답서는 그대 사주와 그대 사정으로 새로 써요</p>
        <div className="mt-3 flex flex-col gap-3">
          <Question text={SAMPLE_Q} topic="일 · 예시" at={Date.UTC(2026, 9, 12, 3)} />
          <AnswerLetter name="예시 손님" text={SAMPLE} at={Date.UTC(2026, 9, 12, 3)} />
        </div>
        <p className="mt-5 text-center text-[13px] text-ink-soft">
          질문 1개 {won(CREDIT_PACKS[1])} · 3개 {won(CREDIT_PACKS[3])} · 5개 {won(CREDIT_PACKS[5])}
        </p>
        <Link href="/login?next=/ask" className="mt-3 block rounded-2xl bg-ink py-3.5 text-center font-myeongjo font-extrabold text-hanji">
          {login}
        </Link>
      </>
    );

  return (
    <>
      <Hall className="mt-5 pt-5">
        <Plaque />
        <div className="mt-5 flex items-center gap-3 border-t border-[#e2bc68]/15 pt-4">
          <HundoFace size={52} />
          <div className="min-w-0 flex-1">
            <p className="font-myeongjo text-[18px] leading-snug font-extrabold">{member.nick}님, 어서 드시옵소서</p>
            <p className="mt-0.5 text-[12.5px] text-hanji/70">오늘은 무엇이 마음에 걸리시옵니까</p>
          </div>
          <div className="shrink-0 rounded-xl border border-[#e2bc68]/40 bg-[#e2bc68]/10 px-3 py-1.5 text-center">
            <span className="block text-[10.5px] text-hanji/70">남은 질문</span>
            <b className="font-myeongjo text-[24px] leading-none text-[#e2bc68]">{member.credits}</b>
            <span className="text-[11px] text-hanji/70">개</span>
          </div>
        </div>
        {(q.joined || q.moved || q.bought) && (
          <p className="mt-4 rounded-xl border border-[#e2bc68]/30 bg-[#e2bc68]/10 px-3.5 py-2.5 text-[13px] leading-relaxed">
            {q.joined && (member.gift && member.log.some((l) => l.why === "가입 선물") ? `질문 ${JOIN_GIFT}개를 드렸사옵니다. ` : "다시 오셨사옵니다. ")}
            {q.moved && <>이 브라우저의 보고서 {String(q.moved)}편을 계정에 담았어요. </>}
            {q.bought && <>질문 {String(q.bought)}개를 채웠어요. </>}
          </p>
        )}
        {latest ? (
          <Link href={`/ask/${latest!.id}`} className={`mt-5 ${GOLD_BUTTON}`}>
            {personOfRoom(latest!)?.name}님 사랑방으로 들어가기 →
          </Link>
        ) : quick ? (
          <form action={openMyRoomAction} className="mt-5">
            <button type="submit" className={GOLD_BUTTON}>
              {me!.person.name}님 사주({iljuOf(me!.person)})로 사랑방 열기 →
            </button>
          </form>
        ) : null}
        <DraftReturn rooms={rooms.map((r) => r!.id)} />
      </Hall>

      {/* Questions to buy: three slips, the middle one marked. */}
      <Hall className="mt-4" glow={false}>
        <h2 className="flex items-baseline justify-between">
          <span className="font-myeongjo text-[17px] font-extrabold">질문 채우기</span>
          <span className="text-[11.5px] text-hanji/60">답서 하나에 질문 하나</span>
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {(Object.keys(CREDIT_PACKS).map(Number) as CreditPack[]).map((n) => (
            <div
              key={n}
              className={`relative flex flex-col rounded-xl px-1.5 pt-3.5 pb-2 ${n === 3 ? "bg-[#e2bc68]/15 ring-2 ring-[#e2bc68]" : "bg-white/[0.04] ring-1 ring-[#e2bc68]/30"}`}
            >
              {n === 3 && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#e2bc68] px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap text-[#17304a]">
                  추천
                </span>
              )}
              <span className="font-myeongjo text-[13px] text-hanji/75">질문</span>
              <b className="font-myeongjo text-[28px] leading-none text-[#e2bc68]">{n}</b>
              <span className="mt-1.5 text-[13px] font-bold">{won(CREDIT_PACKS[n])}</span>
              <PayButton
                request={{ credits: String(n) }}
                label="채우기"
                className={`mt-2.5 w-full rounded-lg py-2 font-myeongjo text-[14px] font-extrabold disabled:opacity-60 ${n === 3 ? "bg-[#e2bc68] text-[#17304a]" : "border border-[#e2bc68]/60 text-[#e2bc68]"}`}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-hanji/55">
          한 번에 여러 가지를 물으시면 무엇부터 볼지 먼저 여쭙고, 그때는 쓰이지 않아요. 안 쓴 질문은{" "}
          <Link href="/refund" className="underline">
            환불 규정
          </Link>
          대로 돌려 드려요.
        </p>
      </Hall>

      {rooms.length > 0 && (
        <section className="mt-6">
          <h2 className="px-1 font-myeongjo text-[17px] font-extrabold">내 사랑방</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {rooms.map((r) => {
              const p = personOfRoom(r!);
              return (
                <li key={r!.id}>
                  <Link href={`/ask/${r!.id}`} className="flex items-center gap-3 rounded-xl border border-[#d4af5f]/40 bg-[#fbf6ea] px-4 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1e2733] font-myeongjo text-[13px] font-bold text-[#e2bc68]">
                      {p ? iljuOf(p).slice(0, 2) : "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15px]">{p?.name}님의 사랑방</b>
                      <span className="text-[12px] text-ink-soft">
                        {p ? iljuOf(p) : ""} · 답서 {r!.used}통{r!.people?.length ? ` · 함께 ${r!.people.map((x) => x.label).join(", ")}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-[#9a7424]">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <details className="mt-3 rounded-xl border border-dashed border-ink/20 px-4 py-3" open={!rooms.length && !quick ? true : undefined}>
        <summary className="cursor-pointer text-[14px] font-bold">{rooms.length ? "＋ 다른 사람 사주로 새 사랑방 열기" : "＋ 내 사주로 사랑방 열기"}</summary>
        <p className="mt-1 text-[12px] text-ink-soft">생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요. 사랑방은 20개까지 열 수 있어요.</p>
        <OpenRoomForm />
      </details>

      <p className="mt-6 text-center text-[12px]">
        <span className="text-ink-soft">회원 번호 {memberNo(member.id)}</span>
        <span className="mx-2 text-ink-soft/40">·</span>
        <a href="/logout" className="text-ink-soft underline">
          로그아웃
        </a>
        <span className="mx-2 text-ink-soft/40">·</span>
        <Link href="/leave" className="text-ink-soft/70 underline">
          회원 탈퇴
        </Link>
      </p>
    </>
  );
}
