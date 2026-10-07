import { titleLines } from "@/lib/columns";

// A column title in two lines: the topic, then the subtitle below it (lib/columns.ts titleLines).
export default function ColumnTitle({ title }: { title: string }) {
  const [head, sub] = titleLines(title);
  return (
    <>
      <span className="block">{head}</span>
      {sub && <span className="block">{sub}</span>}
    </>
  );
}
