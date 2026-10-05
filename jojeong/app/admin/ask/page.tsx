import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { iljuOf, listRooms, personOfRoom } from "@/lib/ask";
import { OpenRoomForm } from "./AskForms";

export const metadata: Metadata = { title: "정 훈도에게 묻기 · 관리자", robots: { index: false } };

const when = (t: number) => new Date(t + 9 * 3600000).toISOString().slice(5, 16).replace("T", " ");

// The owner's trial of 정 훈도에게 묻기: open a room for a chart and talk in it, before anything is sold.
export default async function AskRoomsPage() {
  if (!(await isAdmin()))
    return (
      <p className="doc-paper mt-6 px-5 py-6 text-sm">
        <Link href="/admin" className="underline">
          관리자로 로그인
        </Link>
        한 뒤에 열 수 있어요.
      </p>
    );
  const rooms = await listRooms().catch(() => []);
  return (
    <>
      <p className="mt-4 text-sm">
        <Link href="/admin" className="text-ink-soft underline">
          ← 관리자
        </Link>
      </p>
      <section className="doc-paper mt-3 px-5 py-5">
        <h1 className="font-myeongjo text-xl font-extrabold">정 훈도에게 묻기 · 시험방</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          관리자만 보이는 방이에요. 질문 하나마다 실제 AI가 답해서 몇십 원씩 들어요. 생년월일은 저장하지 않고 사주 글자만 방에 남아요.
        </p>
        <OpenRoomForm />
      </section>
      <section className="doc-paper mt-4 px-5 py-5">
        <h2 className="font-myeongjo text-lg font-extrabold">열린 방 {rooms.length}개</h2>
        {rooms.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">아직 연 방이 없어요. 위에서 첫 방을 열어 보세요.</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-seal/10">
            {rooms.map((r) => {
              const p = personOfRoom(r);
              return (
                <li key={r.id}>
                  <Link href={`/admin/ask/${r.id}`} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <b className="block font-myeongjo">
                        {p?.name ?? "?"}님 <span className="text-sm font-normal text-ink-soft">{p ? iljuOf(p) : ""}</span>
                      </b>
                      <span className="block text-xs text-ink-soft">
                        질문 {r.used}개 · 마지막 {when(r.updatedAt)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-seal px-3 py-1 text-xs font-bold text-hanji">열기</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
