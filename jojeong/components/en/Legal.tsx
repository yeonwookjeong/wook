import { BUSINESS } from "@/lib/business";

// The frame of the English policy pages: a title, the date, the text, and who we are.
export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-3 pt-6 text-[14px] leading-relaxed [&_h2]:mt-4 [&_h2]:font-myeongjo [&_h2]:text-[17px] [&_h2]:font-extrabold [&_li]:ml-4 [&_li]:list-disc">
      <h1 className="font-myeongjo text-[24px] font-extrabold">{title}</h1>
      <p className="text-[12.5px] text-ink-soft">Last updated {updated}</p>
      {children}
      <h2>Who we are</h2>
      <p>
        Hundo Saju (hundosaju.com) is run by {BUSINESS.nameEn} ({BUSINESS.ownerEn}), a business registered in the Republic of Korea, registration number{" "}
        {BUSINESS.regNo}, mail-order registration {BUSINESS.mailOrderEn}. Address: {BUSINESS.addressEn}. Email: {BUSINESS.email}.
      </p>
    </article>
  );
}
