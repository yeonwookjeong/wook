export const OWNER_COOKIE = (courtId: string) => `oj_${courtId}`;
export const MINISTER_COOKIE = (courtId: string) => `mj_${courtId}`;
export const OWNER_PREFIX = "oj_";
// The reader's own chart for the reports (lib/me.ts): name and eight characters, never the birth date.
export const ME_COOKIE = "jj_me";
// Report orders this browser paid for (ids, newest first), for 내 보고서 and to reopen a bought report.
export const ORDERS_COOKIE = "jj_orders";
