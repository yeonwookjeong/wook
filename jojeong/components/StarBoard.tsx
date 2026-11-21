"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { searchStarAction } from "@/app/star/actions";
import type { CelebTag, Hit, StarBoard as Board } from "@/lib/celebs";

// The pair token caps a name at ten letters (lib/pairToken.ts); a longer name is not offered for 궁합.
const pairable = (h: Hit) => [...h.name].length <= 10;

// 나와 같은 일주 유명인 (대표님 11/20: 같은 일주가 본 놀이, 궁합은 연결 상품): same 일주 first, then 사주 쌍둥이,
// then the paid 궁합 report (덤 궁합 3 taken out, 대표님 11/21: 유명인 궁합은 상품으로). One set of category tabs. Names only, never a photo.
const TABS: ("전체" | CelebTag)[] = ["전체", "아이돌", "배우", "가수", "운동선수", "역사 인물"];

const sub = (h: Hit) => [h.tags.includes("역사 인물") ? h.note : h.note || h.tags[0], h.tags.includes("역사 인물") ? "" : `${h.year}년생`].filter(Boolean).join(", ");

// 와/과 after a name: 과 when the last syllable closes on a consonant.
const wa = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c < 11172 && c % 28 ? "과" : "와";
};

function More({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null;
  return (
    <button type="button" onClick={onMore} className="mt-3 w-full rounded-full border border-gold/40 py-2.5 text-[13px] font-bold text-gold">
      더 보기 ({total - shown}명 더)
    </button>
  );
}

// A tap on any name: who it is, and the 유명인 궁합 report with them (대표님 11/21: 덤 대신 상품으로).
function PickSheet({ h, price, onClose }: { h: Hit; price: number; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-[#fffaf0] px-6 pt-6 pb-8 text-center sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <p className="font-myeongjo text-xs font-extrabold tracking-[0.4em] text-seal">星 合</p>
        <p className="mt-2 font-myeongjo text-[22px] font-extrabold">{h.name}</p>
        <p className="text-[13px] text-ink-soft">{sub(h)}</p>
        <p className="mt-4 text-[14.5px] leading-relaxed">
          {h.name}님과 나, 사주로 보면 어떤 사이일까
          <br />
          <span className="text-[13px] text-ink-soft">칭호와 이유는 무료, 친구였다면 같이 일했다면은 보고서로</span>
        </p>
        {pairable(h) ? (
          <a href={`/star/pair?c=${h.id}`} className="mt-5 block rounded-2xl bg-seal py-3.5 font-myeongjo text-[16px] font-extrabold text-white">
            {h.name}님과 궁합 보기 <span className="text-[13px] font-bold opacity-80">{price.toLocaleString("ko-KR")}원</span>
          </a>
        ) : (
          <p className="mt-5 text-[13px] text-ink-soft">이름이 길어 이 분과는 아직 궁합을 볼 수 없사옵니다.</p>
        )}
        <button type="button" onClick={onClose} className="mt-3 w-full py-2 text-[14px] text-ink-soft">
          닫기
        </button>
      </div>
    </div>
  );
}

// Find anyone of the list by name, for the 유명인 궁합.
function Search({ onPick }: { onPick: (h: Hit) => void }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Hit[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div className="mt-3">
      <input
        id="star-search"
        type="search"
        value={q}
        placeholder="좋아하는 유명인 이름"
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (timer.current) clearTimeout(timer.current);
          if (!v.trim()) return setFound(null);
          timer.current = setTimeout(() => searchStarAction(v).then(setFound).catch(() => setFound([])), 250);
        }}
        className="w-full rounded-xl border border-gold/40 bg-white px-4 py-3 text-[16px] text-ink outline-none placeholder:text-ink-soft/60 focus:border-seal"
      />
      {found && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {found.length === 0 && <li className="px-1 text-[13px] text-[#f3e3b8]/80">찾지 못했사옵니다. 이름을 다시 넣어 보시옵소서.</li>}
          {found.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => onPick(h)} className="flex w-full items-baseline gap-2 rounded-xl bg-white px-4 py-2.5 text-left text-ink shadow-[inset_0_0_0_1px_rgb(134_96_26/0.2)]">
                <b className="text-[15px]">{h.name}</b>
                <span className="text-[12px] text-ink-soft">{sub(h)}</span>
                <span className="ml-auto text-[12.5px] font-bold text-seal">궁합 ›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StarBoard({ board, ilju, letters, prices }: { board: Board; ilju: string; letters: { label: string; ch: string }[]; prices: { star: number; pair: number } }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("전체");
  const [nSame, setNSame] = useState(30);
  const [nTwin, setNTwin] = useState(8);
  const [picked, setPicked] = useState<Hit | null>(null);
  const pick = (l: Hit[]) => (tab === "전체" ? l : l.filter((h) => h.tags.includes(tab)));
  const same = pick(board.sameIlju);
  const twins = pick(board.twins);
  const choose = (t: (typeof TABS)[number]) => {
    setTab(t);
    setNSame(30);
    setNTwin(8);
  };

  return (
    <div className="mt-6">
      <section className="doc-paper px-5 py-5 text-center">
        <p className="text-[13px] text-ink-soft">그대가 태어난 날의 기둥은</p>
        <p className="mt-1 font-myeongjo text-[30px] font-extrabold">{ilju}일주</p>
        <div className="mx-auto mt-3 flex w-fit gap-1.5">
          {letters.map((l, i) => (
            <span key={i} className={`flex w-9 flex-col items-center rounded-md py-1 ${i >= 4 ? "bg-seal text-white" : "bg-gold/10 text-ink"}`}>
              <span className="font-myeongjo text-[18px] leading-tight font-extrabold">{l.ch}</span>
              <span className={`text-[9px] ${i >= 4 ? "text-white/80" : "text-ink-soft"}`}>{l.label}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-soft">태어난 시 없이 여섯 글자로 맞대어 보았사옵니다</p>
      </section>

      <div className="sticky top-0 z-10 -mx-4 mt-5 overflow-x-auto bg-hanji/95 px-4 py-2 backdrop-blur [scrollbar-width:none]">
        <div className="flex w-max gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => choose(t)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${tab === t ? "bg-ink text-white" : "bg-white/70 text-ink-soft shadow-[inset_0_0_0_1px_rgb(134_96_26/0.25)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4">
        <h2 className="font-myeongjo text-[19px] font-extrabold">
          나와 같은 {ilju}일주 유명인 <span className="text-gold">{same.length}</span>명
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">태어난 날의 두 글자가 같아, 성정이 닮았다고 보는 사이이옵니다. 이름을 누르면 나와의 궁합이 보이옵니다</p>
        {same.length === 0 ? (
          <p className="mt-4 text-[14px] text-ink-soft">이 갈래에서는 아직 찾지 못했사옵니다.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {same.slice(0, nSame).map((h, i) => (
              <li key={`${h.name}-${h.year}-${i}`}>
                <button type="button" onClick={() => setPicked(h)} className="rounded-full bg-white/80 px-3 py-1.5 text-[13.5px] shadow-[inset_0_0_0_1px_rgb(134_96_26/0.22)]">
                  <b>{h.name}</b>
                  <span className="ml-1 text-[11.5px] text-ink-soft">{h.tags.includes("역사 인물") ? "역사 인물" : h.note || h.tags[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <More shown={nSame} total={same.length} onMore={() => setNSame((n) => n + 30)} />
      </section>

      {twins.length > 0 && (
        <section className="mt-9">
          <h2 className="font-myeongjo text-[19px] font-extrabold">사주 쌍둥이</h2>
          <p className="mt-1 text-[13px] text-ink-soft">여섯 글자 가운데 넷 이상이 그대와 같은 유명인이옵니다</p>
          <ul className="mt-3 flex flex-col gap-2">
            {twins.slice(0, nTwin).map((h, i) => (
              <li key={`${h.name}-${h.year}-${i}`} role="button" tabIndex={0} onClick={() => setPicked(h)} onKeyDown={(e) => e.key === "Enter" && setPicked(h)} className="flex cursor-pointer items-center gap-3 rounded-[14px] bg-[#fffaf0] px-4 py-2.5 shadow-[inset_0_0_0_1px_rgb(134_96_26/0.16)]">
                <span className="font-myeongjo text-[15px] font-extrabold text-seal">
                  {h.same}
                  <span className="text-[11px] text-ink-soft">/6</span>
                </span>
                <b className="text-[15px]">{h.name}</b>
                <span className="text-[12px] text-ink-soft">{sub(h)}</span>
                {h.same === 6 && <span className="ml-auto rounded-md bg-seal px-2 py-0.5 text-[11.5px] font-bold text-white">여섯 글자 모두</span>}
              </li>
            ))}
          </ul>
          <More shown={nTwin} total={twins.length} onMore={() => setNTwin((n) => n + 8)} />
        </section>
      )}

      {/* 유입 (대표님 11/21: 완성하고 내자): the result names two famous faces, the easiest thing to pass to a friend. */}
      <button
        type="button"
        onClick={() => {
          const top = board.sameIlju.slice(0, 2).map((h) => h.name).join(", ");
          const text = `나는 ${ilju}일주${top ? `, ${top}${wa(top)} 같은 날 기둥` : ""}. 너는 누구랑 같을까`;
          const url = "https://www.hundosaju.com/star";
          if (navigator.share) navigator.share({ title: "나와 같은 일주 유명인", text, url }).catch(() => {});
          else navigator.clipboard?.writeText(`${text} ${url}`).then(() => alert("링크를 복사했사옵니다")).catch(() => {});
        }}
        className="mt-9 w-full rounded-xl py-3.5 font-myeongjo text-[15px] font-extrabold text-seal shadow-[inset_0_0_0_1px_rgb(179_38_30/0.4)]"
      >
        벗에게 보내기
      </button>

      {/* Two 궁합 to buy (대표님 11/21): with a famous person, and with one's own person. */}
      <section className="mt-6 rounded-[14px] bg-[#1d2a3a] px-5 py-5 text-[#f3e3b8]">
        <p className="text-center font-myeongjo text-[17px] font-extrabold">궁합, 누구와 보시겠사옵니까</p>
        <div className="mt-4 rounded-xl bg-[#f3e3b8]/10 px-4 py-4">
          <p className="font-myeongjo text-[16px] font-extrabold">
            유명인과 궁합 <span className="text-[13px] font-bold text-[#f3e3b8]/70">{prices.star.toLocaleString("ko-KR")}원</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#f3e3b8]/80">좋아하는 그 사람과 친구였다면, 같이 일했다면</p>
          <Search onPick={setPicked} />
        </div>
        <div className="mt-3 rounded-xl bg-[#f3e3b8]/10 px-4 py-4">
          <p className="font-myeongjo text-[16px] font-extrabold">
            내 사람과 궁합 <span className="text-[13px] font-bold text-[#f3e3b8]/70">{prices.pair.toLocaleString("ko-KR")}원</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#f3e3b8]/80">두 사람의 생일을 나란히 놓고 왜 끌리고 어디서 부딪히는지</p>
          <Link href="/reports/gunghap" className="mt-3 block rounded-xl bg-[#f3e3b8] py-3 text-center text-[14px] font-extrabold text-[#1d2a3a]">
            내 사람과 궁합 보기
          </Link>
        </div>
      </section>
      {picked && <PickSheet h={picked} price={prices.star} onClose={() => setPicked(null)} />}
    </div>
  );
}
