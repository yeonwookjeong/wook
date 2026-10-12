import type { Metadata } from "next";
import Link from "next/link";
import PayButton from "@/components/PayButton";
import { iljuOf, loadRoom, personOfRoom } from "@/lib/ask";
import { currentMember, JOIN_GIFT, membersEnabled } from "@/lib/members";
import { CREDIT_PACKS, type CreditPack } from "@/lib/products";
import { OpenRoomForm } from "./AskForms";

export const metadata: Metadata = {
  title: "정 훈도에게 묻기",
  description: "내 사주를 펼쳐 놓고 정 훈도에게 고민 하나를 여쭈어 보세요. 카카오로 시작하면 첫 질문 하나는 선물이에요.",
  // Out of search until the owner's trial passes and it is linked from the site.
  robots: { index: false },
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 정 훈도에게 묻기: sign in with Kakao (the first question is a gift), buy questions, open a room on one's own chart.
export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const q = await searchParams;
  const member = membersEnabled() ? await currentMember() : null;
  const rooms = member ? (await Promise.all(member.rooms.map(loadRoom))).filter((r) => r && r.member === member.id) : [];

  return (
    <>
      <section className="doc-paper mt-6 px-5 py-6 text-center">
        <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">問 訓 導</p>
        <h1 className="mt-1 font-myeongjo text-2xl font-extrabold">정 훈도에게 묻기</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          그대의 여덟 글자를 펼쳐 두고, 고민 하나를 여쭈시면
          <br />그 사주로 답해 드리옵니다. 지난 대화는 기억해 두었다가 이어 갑니다.
        </p>
      </section>

      {!membersEnabled() ? (
        <p className="doc-paper mt-4 px-5 py-5 text-center text-sm">곧 열려요. 조금만 기다려 주세요.</p>
      ) : !member ? (
        <section className="doc-paper mt-4 px-5 py-5 text-center">
          {q.login === "fail" && <p className="mb-3 rounded-xl bg-seal/10 px-3 py-2 text-sm text-seal">카카오 로그인이 끝나지 않았어요. 다시 시도해 주세요.</p>}
          <p className="text-[14px] leading-relaxed">
            카카오로 시작하면 <b className="text-seal">첫 질문 {JOIN_GIFT}개를 선물</b>로 드려요.
            <br />이 브라우저에서 산 보고서도 계정에 함께 담겨, 다른 기기에서도 열려요.
          </p>
          <a href="/login?next=/ask" className="mt-4 block rounded-2xl bg-[#FEE500] py-3.5 font-bold text-[#191919]">
            카카오로 시작하기
          </a>
          <p className="mt-2 text-[11px] text-ink-soft">카카오에서 받는 것은 회원 번호와 닉네임뿐이에요. 생년월일은 저장하지 않아요.</p>
        </section>
      ) : (
        <>
          {(q.joined || q.moved || q.bought) && (
            <p className="mt-4 rounded-xl border border-seal/30 bg-seal/10 px-4 py-3 text-[13px] leading-relaxed">
              {q.joined && <>어서 오시옵소서, {member.nick}님. 첫 질문 {JOIN_GIFT}개를 드렸사옵니다. </>}
              {q.moved && <>이 브라우저의 보고서 {String(q.moved)}편을 계정에 담았어요. </>}
              {q.bought && <>질문 {String(q.bought)}개를 채웠어요. </>}
            </p>
          )}
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
              <h2 className="font-myeongjo font-extrabold">내 상담방</h2>
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

          <section className="doc-paper mt-4 px-5 py-5">
            <h2 className="font-myeongjo font-extrabold">{rooms.length ? "새 상담방 열기" : "내 사주로 상담방 열기"}</h2>
            <p className="mt-1 text-[12px] text-ink-soft">생년월일은 사주 글자로만 바꿔 두고 저장하지 않아요.</p>
            <OpenRoomForm />
          </section>

          <p className="mt-5 text-center text-[12px]">
            <a href="/logout" className="text-ink-soft underline">
              로그아웃
            </a>
          </p>
        </>
      )}
    </>
  );
}
