// 훈도사주's own accounts, under the name in the footer. Change the handle here if the accounts move.
const SNS = [
  {
    label: "인스타그램",
    href: "https://www.instagram.com/hundosaju/",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "스레드",
    href: "https://www.threads.com/@hundosaju",
    icon: (
      <svg viewBox="0 0 192 192" className="size-[17px]" fill="currentColor" aria-hidden>
        <path
          d="M141.5 88.9c-.8-.4-1.7-.8-2.5-1.2-1.5-27.1-16.3-42.6-41.1-42.8h-.3c-14.8 0-27.2 6.3-34.8 17.9l13.6 9.3c5.7-8.6 14.6-10.4 21.2-10.4h.2c8.2.1 14.4 2.4 18.4 7.1 2.9 3.4 4.9 8.1 5.9 14.1-7.3-1.2-15.2-1.6-23.6-1.2-23.7 1.4-39 15.2-38 34.4.5 9.7 5.4 18.1 13.7 23.6 7.1 4.7 16.2 6.9 25.6 6.4 12.5-.7 22.2-5.4 29-14.1 5.2-6.6 8.4-15.1 9.9-25.9 6 3.6 10.4 8.4 12.9 14.1 4.2 9.8 4.4 25.8-8.6 38.8-11.4 11.4-25.1 16.3-45.8 16.5-23-.2-40.4-7.5-51.7-21.9C35.3 124.2 29.9 104.8 29.7 80c.2-24.8 5.6-44.2 16.1-57.6C57.1 8 74.5.7 97.5.5c23.2.2 40.9 7.5 52.7 21.8 5.8 7 10.1 15.9 13 26.2l15.9-4.2c-3.5-12.8-9-23.8-16.4-32.9C147.5 3.4 125.7-5.8 97.6-6h-.1c-28 .2-49.6 9.4-64.1 27.4C20.5 37.5 13.9 60 13.7 88v.1c.2 28 6.8 50.5 19.7 66.6 14.5 18 36.1 27.3 64.1 27.4h.1c24.9-.2 42.5-6.7 57-21.2 18.9-18.9 18.4-42.6 12.1-57.2-4.5-10.5-13-18.9-25.2-24.8Zm-43.1 40.5c-10.4.6-21.2-4.1-21.7-14.1-.4-7.4 5.3-15.7 22.3-16.7 2-.1 3.9-.2 5.8-.2 6.2 0 11.9.6 17.2 1.7-2 24.4-13.4 28.8-23.6 29.3Z"
          transform="translate(0 6)"
        />
      </svg>
    ),
  },
];

export default function SnsLinks() {
  return (
    <ul className="mt-3 flex items-center justify-center gap-2.5">
      {SNS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`훈도사주 ${s.label}`}
            className="flex size-9 items-center justify-center rounded-full border border-seal/30 bg-white/50 text-seal transition hover:bg-seal hover:text-hanji"
          >
            {s.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
