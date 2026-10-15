import type { Metadata } from "next";
import Link from "next/link";
import CreditSlips from "./CreditSlips";
import { iljuOf, loadRoom, personOfRoom } from "@/lib/ask";
import { ASK_OPEN, CHANNEL_GIFT, CHANNEL_GIFT_ON, currentMember, JOIN_GIFT, KAKAO_CHANNEL, memberNo, membersEnabled, viaEnabled } from "@/lib/members";
import { OpenRoomForm } from "./AskForms";
import DraftReturn from "./DraftReturn";
import DraftCarry from "./DraftCarry";
import { openMyRoomAction } from "./actions";
import { readMe } from "@/lib/me";
import { AnswerLetter, Question } from "./Letter";
import { Floor, GOLD_BUTTON, Hallway, RoomArt } from "./Hall";

export const metadata: Metadata = {
  title: "정 훈도에게 묻기",
  // Out of search until it opens (lib/members.ts ASK_OPEN).
  ...(ASK_OPEN ? {} : { robots: { index: false } }),
  description: "내 사주를 펼쳐 놓고 정 훈도에게 고민 하나를 여쭈어 보세요. 카카오로 로그인하면 처음 한 번 질문 1개를 드려요.",
};

// What a letter looks like, before signing in: a made-up guest, marked 예시, in the five parts he writes.
const SAMPLE_Q = "이직 제안을 받았는데 이번 달 안에 답해야 해요. 가도 될까요?";
const SAMPLE = `[[直答|가되, 서두르지 말 것]] 좋은 자리를 앞에 두고 마음이 바쁘시겠사옵니다. 바로 아뢰자면, ==가셔도 좋은 길이나, 답은 입동 지나 하시는 편이 이롭사옵니다.==
[[時勢|올해 자리가 들썩인 까닭]] 그대 사주의 일터 자리에 올해의 기운이 부딪쳐, 머물던 자리가 좁게 느껴지는 해이옵니다. 제안이 들어온 것도 우연이 아니라 그 흐름이옵니다.
[[性情|확신이 서야 움직이는 사람]] 그대는 한번 정하면 끝까지 가는 분이라, 시작 전에 오래 재십니다. 그 신중함이 이번엔 조건을 더 받아 내는 힘이 되옵니다.
[[時運|11월, 조건이 풀리는 달]] 한로(10월 8일)부터 입동 전까지는 말이 엇갈리기 쉬우니 서명은 미루시고, 입동(11월 7일) 뒤에 연봉과 역할을 다시 짚으시옵소서. 급하게 오늘 답하라는 쪽은 피하시옵소서.
[[一事|물어볼 것 세 가지 적기]] 오늘은 새 자리에 꼭 확인할 것 세 가지만 적어 두시옵소서. 그대는 이미 고를 수 있는 사람이옵니다.`;

// 청심당's own page: the front of the hall at night (the roof, the plaque, the lit paper doors), then its floor.
// Before signing in: what a letter gives, one to see, how it goes, the prices. Signed in: straight into the room,
// the rooms as name boards, and the questions to buy.

const Eyebrow = ({ hanja, children }: { hanja: string; children: React.ReactNode }) => (
  <div className="text-center">
    <p className="font-myeongjo text-[12px] font-bold tracking-[0.5em] text-[#e2bc68]/80 [padding-left:0.5em]">{hanja}</p>
    <h2 className="mt-1 font-myeongjo text-[20px] font-extrabold">{children}</h2>
  </div>
);

// What a letter gives, each with a small look at the thing itself (the sample letter's own words below).
const STAMP = "grid size-9 shrink-0 -rotate-[5deg] place-items-center rounded-[5px] bg-seal font-myeongjo text-[11.5px] leading-[1.05] font-bold text-[#f9f1de] shadow-[inset_0_0_0_1.5px_#b3261e,inset_0_0_0_3px_rgb(249_241_222/0.7)]";
const GIVES: { h: string; t: string; d: string; look: React.ReactNode }[] = [
  {
    h: "直答",
    t: "결론부터",
    d: "된다, 안 된다를 돌려 말하지 않아요",
    look: (
      <p className="font-myeongjo text-[12.5px] leading-snug">
        <span className="bg-[linear-gradient(transparent_55%,rgb(212_175_95/0.55)_55%)] font-bold">가셔도 좋은 길</span>
        <span className="text-ink-soft">이나, 답은 입동 뒤에</span>
      </p>
    ),
  },
  {
    h: "判定",
    t: "한눈 판정",
    d: "답서 맨 위에 판정 카드를 붙여요",
    look: (
      <div className="flex items-center gap-2 rounded-md border border-seal/30 bg-white/60 px-2 py-1.5">
        <span className="grid size-7 place-items-center rounded-full bg-seal font-myeongjo text-[14px] font-extrabold text-[#f9f1de]">吉</span>
        <span className="text-[11px] leading-tight">
          <b className="block text-seal">가도 좋음</b>
          <span className="text-ink-soft">서명은 11월</span>
        </span>
      </div>
    ),
  },
  {
    h: "圖表",
    t: "사주 그림",
    d: "내 사주표와 다가올 달을 그림으로",
    look: (
      <div className="flex items-end gap-2">
        <div aria-hidden className="grid grid-cols-4 gap-[2px] font-myeongjo text-[11px] leading-none">
          {["甲", "丁", "丙", "壬", "子", "未", "午", "申"].map((c, i) => (
            <span key={i} className={`grid size-[17px] place-items-center rounded-[3px] ${i === 2 ? "bg-seal text-[#f9f1de]" : "bg-ink/8"}`}>
              {c}
            </span>
          ))}
        </div>
        <div aria-hidden className="flex h-[36px] items-end gap-[3px]">
          {[40, 65, 30, 90, 55].map((h, i) => (
            <span key={i} className={`w-[5px] rounded-t-sm ${i === 3 ? "bg-seal" : "bg-seal/35"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    h: "記憶",
    t: "이어지는 상담",
    d: "다음에 오면 지난 이야기부터",
    look: (
      <p className="relative rounded-lg rounded-bl-none bg-white/70 px-2 py-1.5 font-myeongjo text-[11.5px] leading-snug shadow-[0_1px_0_rgb(33_27_23/0.08)]">
        지난번 이직 이야기, 이어서 보옵니다
      </p>
    ),
  },
];

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
      <Hallway>
        <RoomArt caption="청심당 · 마음을 듣는 방">
          <div className="text-center">
            <h1 className="font-myeongjo text-[23px] leading-snug font-extrabold drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
              정 훈도가 그대의
              <br />
              <span className="text-[#e2bc68]">고민을 듣사옵니다</span>
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-hanji/80">
              그대의 여덟 글자를 펼쳐 두고,
              <br />
              고민 하나에 답서 한 통을 써 드리옵니다.
            </p>
          </div>
          {(q.login === "fail" || q.login === "again") && (
            <p role="alert" className="mt-4 rounded-xl bg-seal/30 px-3 py-2 text-center text-sm">
              로그인이 끝나지 않았어요. 다시 해 주세요.
            </p>
          )}
          <Link href="/login?next=/ask" className={`mt-6 ${GOLD_BUTTON}`}>
            {login}
          </Link>
          <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-hanji/60">질문과 상담 기록을 계정에 보관해, 다음에 와도 이어서 이야기해요</p>
          <DraftCarry />
        </RoomArt>

        <Floor>
          <Eyebrow hanja="答書">이런 답서를 받아요</Eyebrow>
          <ul className="mt-5 grid grid-cols-2 gap-2.5">
            {GIVES.map((g) => (
              <li
                key={g.h}
                className="flex flex-col rounded-[6px] bg-[#f9f1de] bg-[radial-gradient(circle_at_18%_10%,rgb(255_255_255/0.75),transparent_45%),radial-gradient(circle_at_90%_95%,rgb(168_122_34/0.12),transparent_50%)] px-3 pt-3 pb-3 text-ink shadow-[inset_0_0_0_3px_#f9f1de,inset_0_0_0_4px_rgb(179_38_30/0.4),0_4px_12px_rgb(0_0_0/0.35)]"
              >
                <div className="flex items-center gap-2">
                  <span className={STAMP}>{g.h}</span>
                  <b className="font-myeongjo text-[15px] leading-tight">{g.t}</b>
                </div>
                <div className="mt-2.5 flex min-h-[44px] items-center border-y border-dashed border-seal/20 py-2">{g.look}</div>
                <span className="mt-2 text-[12px] leading-snug text-ink-soft">{g.d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-center text-[12px] text-hanji/60">예시예요 · 실제 답서는 그대 사주와 그대 사정으로 새로 써요</p>
          <div className="mt-3 flex flex-col gap-3 text-ink">
            <Question slip text={SAMPLE_Q} topic="일 · 예시" at={Date.UTC(2026, 9, 12, 3)} />
            <AnswerLetter name="예시 손님" text={SAMPLE} at={Date.UTC(2026, 9, 12, 3)} />
          </div>
        </Floor>

        <Floor className="border-t border-[#e2bc68]/15">
          <Eyebrow hanja="問法">이렇게 여쭤요</Eyebrow>
          <ol className="mt-5 flex flex-col gap-2.5">
            {[
              ["一", "카카오로 로그인", `처음 로그인하면 질문 ${JOIN_GIFT}개를 드려요`],
              ["二", "내 사주로 사랑방 열기", "생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요"],
              ["三", "고민 하나 여쭙기", "무슨 일인지, 누구와, 언제까지 정해야 하는지 적을수록 깊어져요"],
            ].map(([n, t, d]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3.5 py-3 ring-1 ring-[#e2bc68]/25">
                <span className="font-myeongjo text-[24px] leading-none text-[#e2bc68]">{n}</span>
                <span>
                  <b className="block text-[14.5px]">{t}</b>
                  <span className="text-[12px] text-hanji/65">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Floor>

        <Floor className="border-t border-[#e2bc68]/15 pb-10">
          <Eyebrow hanja="問紙">질문</Eyebrow>
          <p className="mt-1 text-center text-[12px] text-hanji/60">답서 한 통에 질문 하나가 쓰여요</p>
          <div className="mt-6">
            <CreditSlips buy={false} />
          </div>
          <Link href="/login?next=/ask" className={`mt-6 ${GOLD_BUTTON}`}>
            {login}
          </Link>
        </Floor>
      </Hallway>
    );

  return (
    <>
      <Hallway>
        <RoomArt caption="청심당 · 마음을 듣는 방">
          <div className="text-center">
            <h1 className="font-myeongjo text-[22px] leading-snug font-extrabold drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
              {member.nick}님, <span className="text-[#e2bc68]">어서 드시옵소서</span>
            </h1>
            <p className="mt-1 text-[13px] text-hanji/75">오늘은 무엇이 마음에 걸리시옵니까</p>
            <p className="mt-3 inline-block rounded-full border border-[#e2bc68]/40 bg-[#e2bc68]/10 px-4 py-1 text-[13px]">
              남은 질문 <b className="font-myeongjo text-[18px] text-[#e2bc68]">{member.credits}</b>개
            </p>
          </div>
          {/* Kakao members who have not had the channel question: add the channel, then come back through Kakao to check. */}
          {CHANNEL_GIFT_ON && member.id.startsWith("k") && !member.channel && (
            <div id="channel" className="mt-4 scroll-mt-4 rounded-xl border border-[#FEE500]/40 bg-[#FEE500]/10 px-3.5 py-3 text-center text-[13px] leading-relaxed">
              <b className="block font-myeongjo text-[14.5px]">카카오톡 채널을 추가하면 질문 {CHANNEL_GIFT}개 더</b>
              <span className="text-hanji/75">새 소식과 좋은 날 알림도 채널로 받아요</span>
              {q.ch && !q.channel && <span className="mt-1 block text-[12px] text-[#e2bc68]">아직 채널 추가가 확인되지 않았어요. 추가한 뒤 다시 눌러 주세요.</span>}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <a
                  href={`https://pf.kakao.com/${KAKAO_CHANNEL}/friend`}
                  target="_blank"
                  rel="noopener"
                  className="rounded-lg bg-[#FEE500] py-2.5 text-[13px] font-extrabold text-[#191919]"
                >
                  ① 채널 추가하기
                </a>
                <a href={`/login/${"kakao"}?ch=1&next=${encodeURIComponent("/ask?ch=1")}`} className="rounded-lg border border-[#FEE500]/60 py-2.5 text-[13px] font-bold">
                  ② 추가했어요, 받기
                </a>
              </div>
            </div>
          )}
          {(q.joined || q.moved || q.bought || q.bonus || q.channel) && (
            <p className="mt-4 rounded-xl border border-[#e2bc68]/30 bg-[#e2bc68]/10 px-3.5 py-2.5 text-center text-[13px] leading-relaxed">
              {q.joined && (member.gift && member.log.some((l) => l.why === "가입 선물") ? `질문 ${JOIN_GIFT}개를 드렸사옵니다. ` : "다시 오셨사옵니다. ")}
              {q.moved && <>이 브라우저의 보고서 {String(q.moved)}편을 계정에 담았어요. </>}
              {q.bought && <>질문 {String(q.bought)}개를 채웠어요. </>}
              {q.bonus && <>보고서와 함께 온 질문 {String(q.bonus)}개도 넣어 드렸어요. </>}
              {q.channel && <>채널 추가 선물로 질문 {CHANNEL_GIFT}개를 넣어 드렸어요. </>}
            </p>
          )}
          {latest ? (
            <Link href={`/ask/${latest!.id}`} className={`mt-6 ${GOLD_BUTTON}`}>
              {personOfRoom(latest!)?.name}님 사랑방으로 들어가기 →
            </Link>
          ) : quick ? (
            <form action={openMyRoomAction} className="mt-6">
              <button type="submit" className={GOLD_BUTTON}>
                {me!.person.name}님 사주({iljuOf(me!.person)})로 사랑방 열기 →
              </button>
            </form>
          ) : null}
          <DraftReturn rooms={rooms.map((r) => r!.id)} />
          <DraftCarry />
        </RoomArt>

        <Floor>
          <Eyebrow hanja="房">내 사랑방</Eyebrow>
          {rooms.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {rooms.map((r) => {
                const p = personOfRoom(r!);
                return (
                  <li key={r!.id}>
                    {/* 문패: a wooden name board on the door */}
                    <Link
                      href={`/ask/${r!.id}`}
                      className="flex items-center gap-3 rounded-lg bg-[linear-gradient(180deg,#6b4a2f,#4e3421)] px-4 py-3 shadow-[inset_0_0_0_1px_rgb(226_188_104/0.35),0_4px_10px_rgb(0_0_0/0.35)] [background-image:repeating-linear-gradient(180deg,rgb(255_255_255/0.04)_0_1px,transparent_1px_6px),linear-gradient(180deg,#6b4a2f,#4e3421)]"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-md border border-[#e2bc68]/50 bg-[#1e1813] font-myeongjo text-[14px] font-bold text-[#e2bc68]">
                        {p ? iljuOf(p).slice(0, 2) : "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block font-myeongjo text-[16px] text-[#f3e1b0]">{p?.name}님의 사랑방</b>
                        <span className="text-[12px] text-hanji/70">
                          {p ? iljuOf(p) : ""} · 답서 {r!.used}통{r!.people?.length ? ` · 함께 ${r!.people.map((x) => x.label).join(", ")}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-[#e2bc68]">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <details className="mt-3 rounded-xl bg-[#f3e7c7] px-4 py-3 text-ink" open={!rooms.length && !quick ? true : undefined}>
            <summary className="cursor-pointer text-[14px] font-bold">
              {rooms.length ? "＋ 다른 사람 사주로 새 사랑방 열기" : "＋ 내 사주로 사랑방 열기"}
            </summary>
            <p className="mt-1 text-[12px] text-ink-soft">생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요. 사랑방은 20개까지 열 수 있어요.</p>
            <OpenRoomForm />
          </details>
        </Floor>

        <Floor className="border-t border-[#e2bc68]/15 pb-10">
          <Eyebrow hanja="問紙">질문 채우기</Eyebrow>
          <p className="mt-1 text-center text-[12px] text-hanji/60">답서 한 통에 질문 하나가 쓰여요</p>
          <div className="mt-6">
            <CreditSlips />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-hanji/55">
            한 번에 여러 가지를 물으시면 무엇부터 볼지 먼저 여쭙고, 그때는 쓰이지 않아요. 안 쓴 질문은{" "}
            <Link href="/refund" className="underline">
              환불 규정
            </Link>
            대로 돌려 드려요.
          </p>
        </Floor>
      </Hallway>

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
