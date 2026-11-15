// One place for everything that names or wires the site. Change the brand here and it changes everywhere.
export const site = {
  name: "오픈런",
  tagline: "청년 기회, 열리자마자 알려드려요",
  description: "공모전, 여행 지원금, 채용 공고를 마감 순으로 골라 보여주는 청년 기회 모음.",
  // The real domain once bought; the build uses it for canonical URLs and the sitemap.
  url: "https://example.com",
  email: "contact@example.com",
  // Leave empty until approved: no ad code or analytics is printed while these are empty.
  adsenseClient: "", // e.g. "ca-pub-0000000000000000"
  adsenseSlot: "",
  ga4Id: "", // e.g. "G-XXXXXXXXXX"
  // One ad between cards after this many cards (mobile 2 columns, PC 3 columns → 6 fits both).
  adEvery: 6,
};

export type Category = "contest" | "travel" | "job";

export const categories: Record<Category, { label: string; emoji: string; path: string; blurb: string }> = {
  contest: { label: "공모전", emoji: "🏆", path: "/contest", blurb: "상금, 난이도, 마감으로 골라 본 공모전" },
  travel: { label: "여행 지원금", emoji: "✈️", path: "/travel", blurb: "여행비를 돌려주는 지역과 한달살기 모집" },
  job: { label: "채용", emoji: "💼", path: "/job", blurb: "공공기관·공기업 신입 공고, 마감 임박순" },
};
