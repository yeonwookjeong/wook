// A royal document: hanji paper with a red double frame (광곽) and faint vertical rules (계선), rolled on wooden
// rods at the top and bottom like a hanging scroll. Wraps the chronicle, the 즉위 교서 and the 교지 cards.
function Rod() {
  return (
    <div className="relative z-10 h-3 rounded-full bg-[linear-gradient(#80552f,#4a2e17_60%,#2e1c0d)] shadow-[0_2px_4px_rgb(0_0_0/0.35)]">
      <span className="absolute top-1/2 -left-1 size-4 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f0cf7e,#a8781f)] ring-1 ring-[#6b4c12]" />
      <span className="absolute top-1/2 -right-1 size-4 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f0cf7e,#a8781f)] ring-1 ring-[#6b4c12]" />
    </div>
  );
}

export default function RoyalDoc({
  children,
  className = "mt-6",
  paperClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  paperClassName?: string;
}) {
  return (
    <div className={`animate-rise ${className}`}>
      <Rod />
      <section className={`doc-paper relative mx-2 -my-1 px-6 pt-8 pb-7 ${paperClassName}`}>{children}</section>
      <Rod />
    </div>
  );
}
