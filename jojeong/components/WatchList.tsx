// A hard month's or day's three lines, each after a small tinted tag so the tag reads as a label ("피할 것",
// "이렇게", "좋은 점"), not as the first word of the sentence. Shared by the ranking page and 오늘의 운세.
const TAGS = [
  { key: "avoid", label: "피할 것", className: "bg-seal/10 text-seal" },
  { key: "prep", label: "이렇게", className: "bg-jade/10 text-jade" },
  { key: "bright", label: "좋은 점", className: "bg-gold/15 text-gold" },
] as const;

export type Watch = { avoid: string; prep: string; bright?: string };

export default function WatchList({ watch, className = "" }: { watch: Watch; className?: string }) {
  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      {TAGS.filter((t) => watch[t.key]).map((t) => (
        <span key={t.key} className="flex items-start gap-2">
          <span className={`mt-px w-[4.4em] shrink-0 rounded-md py-0.5 text-center text-[11px] font-extrabold ${t.className}`}>{t.label}</span>
          <span className="min-w-0 flex-1">{watch[t.key]}</span>
        </span>
      ))}
    </span>
  );
}
