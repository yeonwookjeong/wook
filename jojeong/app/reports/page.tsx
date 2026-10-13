import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import FreeTiles from "@/components/FreeTiles";
import Keep from "@/components/Keep";
import { ownedByProduct, ownedOrders } from "@/lib/pay";
import {
  bonusFor,
  PRICE,
  priceFor,
  priceNow,
  productById,
  SHELF,
  saleLabel,
  saleNow,
  SETS,
  SETS_OFFERED,
  setPrice,
  setRegular,
  type Product,
  type ProductId,
  type SetId,
} from "@/lib/products";
import { pricingNow } from "@/lib/pricing";
import { askShown } from "@/lib/members";
import { newYearOf } from "@/lib/yeonun";

export const metadata: Metadata = { title: "전체 보고서" };

// Every report on one shelf: the present-day readings first, then the Joseon play that opens from the court.
const WHERE: Record<Product["for"], string | null> = { king: "왕이 보는 보고서", minister: "신하가 보는 보고서", anyone: null };

function Row({ p, mine }: { p: Product; mine?: string }) {
  const where = p.modern ? null : WHERE[p.for];
  // Paid in 쪽빛, free on paper, as everywhere on the site.
  const free = Boolean(p.free);
  return (
    <li>
      <Link href={mine ?? `/reports/${p.id}`} className={`${free ? "doc-paper" : "jjok-box"} flex items-center gap-4 px-5 py-5`}>
        <span
          className={`flex h-14 min-w-14 shrink-0 items-center justify-center border-2 px-1 font-myeongjo font-extrabold ${free ? "border-seal/60 text-seal" : "border-gold/60 text-gold"} ${p.hanja.length > 2 ? "text-sm" : "text-lg"}`}
        >
          {p.hanja}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-lg leading-snug font-extrabold">{p.title}</span>
          <span className={`mt-0.5 block text-[13px] leading-snug ${free ? "text-ink-soft" : "text-hanji/75"}`}>
            <Keep clauses>{p.tagline}</Keep>
          </span>
          {where && <span className="mt-1 inline-block border border-gold/60 px-1.5 text-[10px] font-bold text-gold">{where}</span>}
        </span>
        <span className={`shrink-0 text-right font-myeongjo font-extrabold ${free ? "text-seal" : "text-gold"}`}>
          {mine ? (
            <span className="text-sm">결제함</span>
          ) : p.free ? (
            "무료"
          ) : (
            // The price is said once at the top of the page, not on every report.
            <span className="text-sm">보기 →</span>
          )}
        </span>
      </Link>
    </li>
  );
}

// A set's reports as short chips (the full titles run long side by side).
const SHORT: Partial<Record<ProductId, string>> = { pyeongsaeng: "평생 사주", yeonae: "연애·결혼", jaemul: "재물운", jikup: "직업·적성", yeonun: "연운" };

// Sets: a card each, unlike the report rows above: the reports as chips, and the price beside the sum of the
// singles struck through. The 새해 set shows only in its season (September to February).
function SetCard({ id, ny }: { id: SetId; ny: number | null }) {
  const set = SETS[id];
  const sum = set.products.length * PRICE;
  const first = set.products[0];
  const href = id === "ny" && ny ? `/reports/yeonun?y=${ny}` : `/reports/${first}`;
  return (
    <li>
      <Link href={href} className="jjok-box block px-5 py-4">
        <b className="block font-myeongjo text-[17px]">{set.title}</b>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {set.products.map((p) => (
            <span key={p} className="rounded-md border border-gold/40 bg-white/5 px-2 py-0.5 text-[12px] font-bold text-hanji/90">
              {p === "yeonun" && ny ? `${ny} 신년운세` : (SHORT[p] ?? productById(p)!.title)}
            </span>
          ))}
        </span>
        <span className="mt-2.5 flex items-baseline justify-end gap-2">
          <s className="text-[12px] text-hanji/50">{sum.toLocaleString("ko-KR")}원</s>
          <b className="font-myeongjo text-xl text-gold">{set.price.toLocaleString("ko-KR")}원</b>
        </span>
      </Link>
    </li>
  );
}

function JoseonShelf() {
  const joseon = SHELF.filter((p) => !p.modern);
  return (
    <section className="mt-9">
      <h2 className="font-myeongjo text-lg font-extrabold">재미로 보는 조선 사주</h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">조선 시대로 가 보는 무료 놀이예요. 혼자도, 친구와도</p>
      <FreeTiles
        className="mt-3"
        tiles={[
          ...joseon.map((p) => ({ href: `/reports/${p.id}`, hanja: p.hanja, title: p.title, line: "조선에 태어났다면 어떤 신분이었을까", tag: "혼자" })),
          { href: "/king", hanja: "王", title: "왕이 될 사주", line: "친구를 불러 내 조정을 꾸리는 놀이", tag: "친구와" },
        ]}
      />
    </section>
  );
}

// ── A안 shelf (lib/products.ts PRICING_A_LIVE, and the owner's 시안 모드): grouped by what one wants, each with its
// price and the questions it brings; the sets first, 청심당 last.
type Item = { href: string; hanja: string; title: string; line: string; price: number; qs: number };

function ShelfRow({ x, mine }: { x: Item; mine?: string }) {
  return (
    <li>
      <Link href={mine ?? x.href} className="jjok-box flex items-center gap-4 px-5 py-4">
        <span
          className={`flex h-14 min-w-14 shrink-0 items-center justify-center border-2 border-gold/60 px-1 font-myeongjo font-extrabold text-gold ${x.hanja.length > 2 ? "text-sm" : "text-lg"}`}
        >
          {x.hanja}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-myeongjo text-[17px] leading-snug font-extrabold">{x.title}</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-hanji/75">
            <Keep clauses>{x.line}</Keep>
          </span>
          {x.qs > 0 && (
            <span className="mt-1.5 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-[10.5px] font-bold text-gold">정 훈도 질문 {x.qs}개 포함</span>
          )}
        </span>
        <span className="shrink-0 text-right font-myeongjo font-extrabold text-gold">
          {mine ? (
            <span className="text-sm">결제함</span>
          ) : x.price ? (
            <span className="text-[15px]">{x.price.toLocaleString("ko-KR")}원</span>
          ) : (
            <span className="text-sm">보기 →</span>
          )}
        </span>
      </Link>
    </li>
  );
}

const Group = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-myeongjo text-lg font-extrabold">{title}</h2>
    {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    <ul className="mt-3 flex flex-col gap-2.5">{children}</ul>
  </section>
);

async function ShelfA({ owned }: { owned: ReturnType<typeof ownedByProduct> }) {
  const ny = newYearOf();
  const item = (id: ProductId, over: Partial<Item> = {}): Item => {
    const p = productById(id)!;
    return { href: `/reports/${id}`, hanja: p.hanja, title: p.title, line: p.tagline, price: priceFor(id, "a"), qs: bonusFor("a", id, null), ...over };
  };
  const sets = SETS_OFFERED.a.filter((s) => !SETS[s].products.includes("yeonun") || ny);
  const free = productById("gukjeong");
  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">報 告</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">전체 보고서</h1>
        <p className="mt-2 text-[15px] leading-relaxed">궁금한 것부터 골라 보세요</p>
        <p className="mt-1 text-sm text-ink-soft">산 보고서는 &lsquo;내 보고서&rsquo;에서 언제든 다시 열려요</p>
      </section>

      <Group title="한 번에 보기" sub="세트에 든 보고서 아무거나 열면 결제 화면에서 세트로 고를 수 있어요">
        {sets.map((s) => (
          <li key={s}>
            <Link href={ny ? `/reports/yeonun?y=${ny}` : `/reports/${SETS[s].products[0]}`} className="jjok-box block px-5 py-4">
              <span className="flex items-baseline justify-between gap-2">
                <b className="font-myeongjo text-[18px]">{SETS[s].title}</b>
                <span className="flex items-baseline gap-2">
                  <span className="text-[13px] font-extrabold text-[#ff7a5c]">{Math.round((1 - setPrice(s, "a") / setRegular(s, "a", ny)) * 100)}%</span>
                  <s className="text-[12px] text-hanji/50">{setRegular(s, "a", ny).toLocaleString("ko-KR")}원</s>
                  <b className="font-myeongjo text-xl text-gold">{setPrice(s, "a").toLocaleString("ko-KR")}원</b>
                </span>
              </span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {SETS[s].products.map((p) => (
                  <span key={p} className="rounded-md border border-gold/40 bg-white/5 px-2 py-0.5 text-[12px] font-bold text-hanji/90">
                    {p === "yeonun" && ny ? `${ny} 신년운세` : (SHORT[p] ?? productById(p)!.title)}
                  </span>
                ))}
              </span>
              <span className="mt-2 inline-block rounded-full bg-gold/20 px-2 py-0.5 text-[10.5px] font-bold text-gold">
                정 훈도 질문 {bonusFor("a", null, s)}개 포함
              </span>
            </Link>
          </li>
        ))}
      </Group>

      <Group title="내 사주를 깊이">
        <ShelfRow x={item("pyeongsaeng")} mine={owned.pyeongsaeng?.href} />
        {ny && (
          <ShelfRow
            x={item("yeonun", {
              href: `/reports/yeonun?y=${ny}`,
              title: `${ny} 신년운세`,
              line: "붉은 양의 해, 나에게 무슨 일이 올까? 열두 달 흐름과 좋은 날",
              price: priceFor("yeonun", "a", ny, ny),
              qs: bonusFor("a", "yeonun", null, ny, ny),
            })}
          />
        )}
        <ShelfRow x={item("yeonae")} mine={owned.yeonae?.href} />
        <ShelfRow x={item("jaemul")} mine={owned.jaemul?.href} />
        <ShelfRow x={item("jikup")} mine={owned.jikup?.href} />
        <ShelfRow x={item("yeonun", { title: "다른 해 운세", line: "지난해나 그다음 해를 한 해씩 깊게" })} />
        {free && <ShelfRow x={{ href: "/reports/gukjeong", hanja: free.hanja, title: free.title, line: free.tagline, price: 0, qs: 0 }} />}
      </Group>

      <Group title="두 사람을 함께">
        <ShelfRow x={item("gunghap")} mine={owned.gunghap?.href} />
      </Group>

      <Group title="좋은 날을 고르는">
        <ShelfRow x={item("taekil")} />
      </Group>

      {(await askShown()) && (
        <section className="mt-8">
          <h2 className="font-myeongjo text-lg font-extrabold">정 훈도에게 직접</h2>
          <Link
            href="/ask"
            className="mt-3 block rounded-2xl bg-gradient-to-b from-[#222d3b] to-[#1a232f] px-5 py-4 text-hanji shadow-[inset_0_0_0_1px_rgb(212_175_95/0.35)]"
          >
            <span className="font-myeongjo text-[12px] font-bold tracking-[0.3em] text-[#e2bc68]">聽心堂 · 청심당</span>
            <b className="mt-1 block font-myeongjo text-[18px]">정 훈도에게 묻기</b>
            <span className="mt-0.5 block text-[12.5px] text-hanji/75">보고서는 사주를 읽고, 사랑방은 그대의 고민을 읽어요</span>
            <span className="mt-2 block text-right font-myeongjo font-extrabold text-[#e2bc68]">질문 990원부터 →</span>
          </Link>
        </section>
      )}
    </>
  );
}

export default async function ReportsPage() {
  // Rendered per request, so a sale starts and ends on its dates without a redeploy.
  await connection();
  if ((await pricingNow()) === "a") {
    const owned = ownedByProduct(await ownedOrders().catch(() => []));
    return (
      <>
        <ShelfA owned={owned} />
        <JoseonShelf />
      </>
    );
  }
  const price = priceNow();
  const owned = ownedByProduct(await ownedOrders().catch(() => []));
  const sale = saleNow();
  const modern = SHELF.filter((p) => p.modern);
  const ny = newYearOf();

  return (
    <>
      <section className="mt-6 text-center">
        <p className="font-myeongjo text-sm font-extrabold tracking-[0.4em] text-seal">報 告</p>
        <h1 className="mt-2 font-myeongjo text-3xl font-extrabold">전체 보고서</h1>
        <p className="mt-2 text-[15px] leading-relaxed">궁금한 것부터 골라 보세요</p>
        <p className="mt-1 text-sm">
          {sale ? (
            <b className="text-seal">{saleLabel(sale)}</b>
          ) : (
            <span className="text-ink-soft">
              보고서 한 편 <b className="text-ink">{price.toLocaleString("ko-KR")}원</b> · 산 보고서는 &lsquo;내 보고서&rsquo;에서 언제든 다시 열려요
            </span>
          )}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-myeongjo text-lg font-extrabold">내 사주 보고서</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {modern.map((p) => (
            <Row key={p.id} p={p} mine={owned[p.id]?.href} />
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-myeongjo text-lg font-extrabold">세트로 보면 더 저렴해요</h2>
        <p className="mt-1 text-xs text-ink-soft">세트에 든 보고서 아무거나 열면 결제 화면에서 세트로 고를 수 있어요</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {SETS_OFFERED.old
            .filter((id) => id !== "ny" || ny)
            .map((id) => (
              <SetCard key={id} id={id} ny={ny} />
            ))}
        </ul>
      </section>

      <JoseonShelf />
    </>
  );
}
