import { BUSINESS } from "@/lib/business";

// Plain document layout for the legal pages. Business fields fall back to a visible placeholder until filled.
export const biz = (key: keyof typeof BUSINESS, label: string) => BUSINESS[key] || `(${label})`;

export default function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="doc-paper mt-6 px-6 pt-8 pb-8 text-[14px] leading-relaxed [&_h2]:mt-5 [&_h2]:font-myeongjo [&_h2]:text-base [&_h2]:font-extrabold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-center font-myeongjo text-2xl font-extrabold">{title}</h1>
      <p className="mt-1 text-center text-xs text-ink-soft">시행일 {updated}</p>
      {children}
    </article>
  );
}
