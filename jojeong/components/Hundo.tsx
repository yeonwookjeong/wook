import { CHARACTER, CHARACTER_NAME, type Mood } from "@/lib/brand";

export default function Hundo({ children, mood = "face" }: { children: React.ReactNode; mood?: Mood }) {
  return (
    <div className="flex items-end gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CHARACTER[mood]}
        alt={CHARACTER_NAME}
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-full border-2 border-gold/40 bg-white object-cover"
      />
      <div className="relative flex-1 rounded-2xl rounded-bl-sm border border-ink/10 bg-white/80 px-4 py-3 text-[15px] leading-relaxed shadow-sm">
        <p className="mb-0.5 text-xs font-bold text-gold">{CHARACTER_NAME}</p>
        {children}
      </div>
    </div>
  );
}
