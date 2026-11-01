// The 신살 도감's night: the pages sit in the same dark sky as the cards' pictures, edge to edge in the column.
export default function SinsalNight({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 mt-2 rounded-[28px] bg-[radial-gradient(circle_at_50%_0,#1f3d5c,transparent_55%),linear-gradient(180deg,#0b1626,#13263d_45%,#0f2236)] px-4 pt-2 pb-8 text-hanji">
      {children}
    </div>
  );
}

// A panel on the night: faint glass with a gold hairline.
export const NIGHT_PANEL = "rounded-2xl border border-[#d4af5f]/30 bg-white/[0.04]";
export const NIGHT_GOLD = "text-[#d4af5f]";
