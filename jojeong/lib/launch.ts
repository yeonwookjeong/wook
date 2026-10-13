import "server-only";
import { isPreview } from "./admin";
import { OPEN, RENEW2 } from "./open";

// Open (lib/open.ts), or the owner looking as if it were.
export const openNow = async () => OPEN || (await isPreview());
// The second pass on the bought reports (lib/open.ts RENEW2), or the owner looking as if it were on.
export const renewNow = async () => RENEW2 || (await isPreview());
