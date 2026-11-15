// The first thing on the free reading, before any table: who the reader is in one image (their day pillar's),
// what is biggest, what is rarest and their star, and money, love and work in a word each. Everything here is
// already computed for the screen below (lib/freeReading.ts, lib/rarity.ts); this only puts the best of it first.
type Chip = { label: string; value: string; note?: string };

export default function IdentityCard({
  name,
  hanja,
  ilju,
  image,
  chips,
  kinds,
}: {
  name: string;
  hanja: string;
  ilju: string;
  image: string | null;
  chips: Chip[];
  kinds: [string, string][];
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-3xl bg-[#14263a] px-5 py-6 text-hanji shadow-[0_12px_30px_rgb(0_0_0/0.18),inset_0_0_0_1px_rgb(226_188_104/0.35)]">
      <p className="text-center text-[12px] font-bold tracking-[0.3em] text-[#e2bc68]">{name}님은 한마디로</p>
      <p className="mt-2 text-center font-myeongjo text-[26px] leading-tight font-extrabold">{image ?? ilju}</p>
      <p className="mt-1.5 text-center text-[12.5px] text-hanji/70">
        <span className="font-myeongjo text-[15px] text-[#e2bc68]">{hanja}</span> {ilju}
      </p>
      <ul className="mt-5 grid grid-cols-3 gap-2 text-center">
        {chips.map((c) => (
          <li key={c.label} className="rounded-xl bg-white/[0.06] px-1.5 py-2.5">
            <p className="text-[10.5px] text-hanji/60">{c.label}</p>
            <p className="mt-1 font-myeongjo text-[13.5px] leading-snug font-extrabold">{c.value}</p>
            {c.note && <p className="mt-0.5 text-[10.5px] text-[#e2bc68]">{c.note}</p>}
          </li>
        ))}
      </ul>
      {kinds.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-[13.5px]">
          {kinds.map(([k, v]) => (
            <li key={k} className="flex items-baseline gap-2">
              <b className="w-8 shrink-0 font-myeongjo text-[#e2bc68]">{k}</b>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
