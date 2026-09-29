// Korean text wraps between words, but a browser may still break right after a middle dot ("돈·일·연애·/건강").
// Keep renders a string with each dotted run ("돈·일·연애·건강의") and each "조선 N대 왕" held on one line.
// With `clauses`, each comma-separated clause also moves to the next line as a unit ("조심할 / 달" never happens).
// Only short ones are held: a run or clause longer than a narrow line (a list of eight 택일 occasions, a long
// question) would otherwise spill past its box or push a lone "우리 둘," onto a line of its own, so it wraps as
// plain text instead (a long dotted list breaking only after a dot).
const HOLD_MAX = 13;
const RUN = /(\S*·\S*|조선 \d+대 왕)/;

function runs(text: string) {
  return text.split(RUN).map((part, i) =>
    i % 2 === 0 ? (
      part
    ) : part.length <= HOLD_MAX ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      // A long list may break, but only after a dot (keep-all gives it no other place but mid-word).
      <span key={i}>
        {part.split("·").map((w, j) => (
          <span key={j}>
            {j > 0 && (
              <>
                ·<wbr />
              </>
            )}
            {w}
          </span>
        ))}
      </span>
    ),
  );
}

export default function Keep({ children, clauses = false }: { children: string; clauses?: boolean }) {
  if (!clauses) return runs(children);
  const parts = children.split(/(?<=,) /);
  return parts.map((part, i) => (
    <span key={i}>
      {part.length <= HOLD_MAX ? <span className="inline-block">{runs(part)}</span> : runs(part)}
      {i < parts.length - 1 && " "}
    </span>
  ));
}
