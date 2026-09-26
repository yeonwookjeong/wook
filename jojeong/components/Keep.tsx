// Korean text wraps between words, but a browser may still break right after a middle dot ("돈·일·연애·/건강").
// Keep renders a string with each dotted run ("돈·일·연애·건강의") and each "조선 N대 왕" held on one line.
// With `clauses`, each comma-separated clause also moves to the next line as a unit ("조심할 / 달" never happens).
const RUN = /(\S*·\S*|조선 \d+대 왕)/;

function runs(text: string) {
  return text.split(RUN).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function Keep({ children, clauses = false }: { children: string; clauses?: boolean }) {
  if (!clauses) return runs(children);
  const parts = children.split(/(?<=,) /);
  return parts.map((part, i) => (
    <span key={i}>
      <span className="inline-block">{runs(part)}</span>
      {i < parts.length - 1 && " "}
    </span>
  ));
}
