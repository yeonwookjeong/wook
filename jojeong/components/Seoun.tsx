import { CHARACTER_IMAGE, CHARACTER_NAME } from "@/lib/brand";

export default function Seoun({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CHARACTER_IMAGE} alt={CHARACTER_NAME} width={64} height={64} className="size-16 shrink-0" />
      <div className="relative flex-1 rounded-2xl rounded-bl-sm border border-ink/10 bg-white/80 px-4 py-3 text-[15px] leading-relaxed shadow-sm">
        <p className="mb-0.5 text-xs font-bold text-gold">{CHARACTER_NAME}</p>
        {children}
      </div>
    </div>
  );
}
