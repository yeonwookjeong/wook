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

export const metadata: Metadata = {
  title: "정 훈도에게 묻기",
  // Out of search until it opens (lib/members.ts ASK_OPEN).
  ...(!ASK_OPEN && { robots: { index: false } }),
  description: "내 사주를 펼쳐 놓고 정 훈도에게 고민 하나를 여쭈어 보세요. 카카오로 시작하면 첫 질문 하나는 선물이에요.",
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// What a letter looks like, before signing in: a made-up guest, marked 예시, in the five parts he writes.
const SAMPLE_Q = "이직 제안을 받았는데 이번 달 안에 답해야 해요. 가도 될까요?";
const SAMPLE = `[[直答|가되, 서두르지 말 것]] 좋은 자리를 앞에 두고 마음이 바쁘시겠사옵니다. 바로 아뢰자면, ==가셔도 좋은 길이나, 답은 입동 지나 하시는 편이 이롭사옵니다.==
[[時勢|올해 자리가 들썩인 까닭]] 그대 사주의 일터 자리에 올해의 기운이 부딪쳐, 머물던 자리가 좁게 느껴지는 해이옵니다. 제안이 들어온 것도 우연이 아니라 그 흐름이옵니다.
[[性情|확신이 서야 움직이는 사람]] 그대는 한번 정하면 끝까지 가는 분이라, 시작 전에 오래 재십니다. 그 신중함이 이번엔 조건을 더 받아 내는 힘이 되옵니다.
[[時運|11월, 조건이 풀리는 달]] 한로(10월 8일)부터 입동 전까지는 말이 엇갈리기 쉬우니 서명은 미루시고, 입동(11월 7일) 뒤에 연봉과 역할을 다시 짚으시옵소서. 급하게 오늘 답하라는 쪽은 피하시옵소서.
[[一事|물어볼 것 세 가지 적기]] 오늘은 새 자리에 꼭 확인할 것 세 가지만 적어 두시옵소서. 그대는 이미 고를 수 있는 사람이옵니다.`;

// 정 훈도에게 묻기: sign in with Kakao (the first question is a gift), buy questions, open a room on one's own chart.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const q = await searchParams;
  const member = membersEnabled() ? await currentMember() : null;
  const me = member ? await readMe() : null;
  const rooms = member ? (await Promise.all(member.rooms.map(loadRoom))).filter((r) => r && r.member === member.id) : [];
  const quick = Boolean(me?.person.gender) && !rooms.some((r) => r!.me === me!.token);
  // With Naver or Google on, the button goes to the choice of ways (app/login); Kakao alone, it says so.
  const others = viaEnabled("naver") || viaEnabled("google");
  const start = others ? "카카오·네이버·구글로 시작하기" : "카카오로 시작하기";
  const startClass = others ? "bg-ink text-hanji" : "bg-[#FEE500] text-[#191919]";

  return (
    <>
      <section className="jjok-box mt-5 px-5 pt-6 pb-5 text-center">
        <div className="flex justify-center">
          <HundoFace size={68} />
        </div>
        <p className="mt-3 font-myeongjo text-[11px] font-bold tracking-[0.3em] text-[#d4af5f]">聽心堂 · 정 훈도의 사랑방</p>
        <h1 className="mt-1 font-myeongjo text-2xl font-extrabold">정 훈도에게 묻기</h1>
        <p className="mt-2 text-[14px] leading-relaxed opacity-85">
          그대의 여덟 글자를 펼쳐 두고, 고민 하나에 답서를 써 드리옵니다.
          <br />
          지난 상담은 기억해 두었다가 이어 갑니다.
        </p>
      </section>

      {!membersEnabled() ? (
        <p className="doc-paper mt-4 px-5 py-5 text-center text-sm">곧 열려요. 조금만 기다려 주세요.</p>
      ) : !member ? (
        <>
          <section className="doc-paper mt-4 px-5 py-5 text-center">
            <p className="text-[14px] leading-relaxed">
              카카오로 시작하면 <b className="text-seal">첫 질문 {JOIN_GIFT}개를 선물</b>로 드려요.
              <br />이 브라우저에서 산 보고서도 계정에 함께 담겨, 다른 기기에서도 열려요.
            </p>
            <Link href="/login?next=/ask" className={`mt-4 block rounded-2xl py-3.5 font-bold ${startClass}`}>
              {start}
            </Link>
            <p className="mt-2 text-[11px] text-ink-soft">받는 것은 회원 번호, 별명, 이메일뿐이에요. 생년월일은 저장하지 않아요.</p>
          </section>

          <h2 className="mt-7 text-center font-myeongjo text-lg font-extrabold">이런 답서를 받아요</h2>
          <p className="mt-1 text-center text-[12px] text-ink-soft">예시예요 · 실제 답서는 그대 사주와 그대 사정으로 새로 써요</p>
          <div className="mt-3 flex flex-col gap-3">
            <Question text={SAMPLE_Q} topic="일 · 예시" at={Date.UTC(2026, 9, 12, 3)} />
            <AnswerLetter name="예시 손님" text={SAMPLE} at={Date.UTC(2026, 9, 12, 3)} />
          </div>

          <section className="doc-paper mt-6 px-5 py-5">
            <h2 className="text-center font-myeongjo text-lg font-extrabold">이렇게 여쭤요</h2>
            <ol className="mt-3 flex flex-col gap-3 text-[14px] leading-relaxed">
              {[
                ["시작하기", `카카오로 처음 시작하면 첫 질문 ${JOIN_GIFT}개를 선물로 드려요.`],
                ["내 사주로 사랑방 열기", "생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요."],
                ["고민 하나 여쭙기", "지금 상황을 한두 줄 같이 적으면 더 깊어져요. 답서는 30초~1분이면 와요."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-jjok font-myeongjo text-[13px] font-extrabold text-[#d4af5f]">
                    {i + 1}
                  </span>
                  <span>
                    <b className="block">{t}</b>
                    <span className="text-[13px] text-ink-soft">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-seal/15 pt-3 text-center text-[13px]">
              질문 1개 {won(CREDIT_PACKS[1])} · 3개 {won(CREDIT_PACKS[3])} · 5개 {won(CREDIT_PACKS[5])}
            </p>
            <Link href="/login?next=/ask" className={`mt-3 block rounded-2xl py-3.5 text-center font-bold ${startClass}`}>
              {start}
            </Link>
          </section>
        </>
      ) : (
        <>
          {(q.joined || q.moved || q.bought) && (
            <p className="mt-4 rounded-xl border border-seal/30 bg-seal/10 px-4 py-3 text-[13px] leading-relaxed">
              {q.joined && (
                <>
                  어서 오시옵소서, {member.nick}님.{member.gift && member.log.some((l) => l.why === "가입 선물") ? ` 첫 질문 ${JOIN_GIFT}개를 드렸사옵니다.` : ""}{" "}
                </>
              )}
              {q.moved && <>이 브라우저의 보고서 {String(q.moved)}편을 계정에 담았어요. </>}
              {q.bought && <>질문 {String(q.bought)}개를 채웠어요. </>}
            </p>
          )}
          {/* The chart from the free reading, one tap to a room (unless one is open on it already). */}
          {quick && (
            <form action={openMyRoomAction} className="mt-4">
              <button type="submit" className="jjok-box flex w-full items-center gap-3 px-4 py-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-bold text-[#d4af5f]">무료 사주에서 넣으신 사주 그대로</span>
                  <b className="block font-myeongjo text-[17px]">
                    {me!.person.name}님 사주({iljuOf(me!.person)})로 바로 열기
                  </b>
                </span>
                <span className="shrink-0 font-bold text-[#d4af5f]">→</span>
              </button>
            </form>
          )}
          <DraftReturn rooms={rooms.map((r) => r!.id)} />

          <section className="doc-paper mt-4 px-5 py-5">
            <p className="flex items-baseline justify-between">
              <b className="font-myeongjo text-lg">{member.nick}님</b>
              <span className="text-sm">
                남은 질문 <b className="font-myeongjo text-2xl text-seal">{member.credits}</b>개
              </span>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(Object.keys(CREDIT_PACKS).map(Number) as CreditPack[]).map((n) => (
                <div key={n} className="rounded-xl border border-seal/25 bg-white/50 px-1 pt-2 pb-1">
                  <b className="block font-myeongjo">질문 {n}개</b>
                  <span className="block text-[12px] text-ink-soft">{won(CREDIT_PACKS[n])}</span>
                  <PayButton request={{ credits: String(n) }} label="채우기" secondary />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              답 하나에 질문 하나가 쓰여요. 한 번에 여러 가지를 물으시면 무엇부터 볼지 먼저 여쭙고, 그때는 쓰이지 않아요. 안 쓴 질문은{" "}
              <Link href="/refund" className="underline">
                환불 규정
              </Link>
              대로 돌려 드려요.
            </p>
          </section>

          {rooms.length > 0 && (
            <section className="doc-paper mt-4 px-5 py-4">
              <h2 className="font-myeongjo font-extrabold">내 사랑방</h2>
              <ul className="mt-2 flex flex-col divide-y divide-seal/10">
                {rooms.map((r) => {
                  const p = personOfRoom(r!);
                  return (
                    <li key={r!.id}>
                      <Link href={`/ask/${r!.id}`} className="flex items-center justify-between py-2.5 text-[14px]">
                        <span>
                          <b>{p?.name}님</b> <span className="text-ink-soft">{p ? iljuOf(p) : ""}</span>
                        </span>
                        <span className="text-[12px] text-ink-soft">답 {r!.used}개 →</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {rooms.length || quick ? (
            <details className="doc-paper mt-4 px-5 py-4">
              <summary className="cursor-pointer font-myeongjo font-extrabold">{rooms.length ? "＋ 새 사랑방 열기 (다른 사람 사주로)" : "＋ 다른 생년월일로 열기"}</summary>
              <p className="mt-1 text-[12px] text-ink-soft">생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요.</p>
              <OpenRoomForm />
            </details>
          ) : (
            <section className="doc-paper mt-4 px-5 py-5">
              <h2 className="font-myeongjo font-extrabold">내 사주로 사랑방 열기</h2>
              <p className="mt-1 text-[12px] text-ink-soft">생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요.</p>
              <OpenRoomForm />
            </section>
          )}

          <p className="mt-5 text-center text-[12px]">
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
      )}
    </>
  );
}
