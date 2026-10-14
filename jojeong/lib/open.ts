// The grand opening, one switch: 청심당 (정 훈도에게 묻기) for everyone, the new prices and sets (A안), the new home
// and header, the answer letters' pictures and verdict card, and the opening notice. Off, only the owner's 시안
// 모드 sees them. Reports bought after it is on are the new version (lib/pay.ts Order.shop). Kept free of imports,
// since the price list (lib/products.ts) is read in the browser too.
export const OPEN = true;

// The second pass on the bought reports (2026-10-14): the chart on top, a picture in each chapter, the three-line
// point box, and the tidier page after paying. For reports bought in the opened shop only (Order.shop), never the
// ones bought before the opening. Off, only the owner's 시안 모드 sees it.
export const RENEW2 = true;
