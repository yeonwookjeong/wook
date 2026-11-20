import { createHash } from "node:crypto";

// 호패함: a reader's result keeps the 호패 of the friends who opened their link and entered their own chart.
// The box is named from the result itself (the same fields as the share card, lib/shareToken.ts SinbunSummary), so
// the owner's page and a friend's arrival through either link (the card or the full chart) find the same box without
// storing anyone's chart. Two people with the same name and the very same life would share one box; rare enough.
// The rarity and the pair lines live in lib/hopaeShare.ts.
export type BoxOwner = { n: string; r: string; j: string; l: string; t?: string };
export const boxOf = (o: BoxOwner) =>
  createHash("sha256").update(JSON.stringify(["hopae-box", o.n, o.r, o.j, o.l, o.t ?? ""])).digest("base64url").slice(0, 16);
// A friend, kept once per box: from the chart's encoded token, never stored itself.
export const friendKeyOf = (personToken: string) => createHash("sha256").update(`hopae-friend:${personToken}`).digest("base64url").slice(0, 12);
