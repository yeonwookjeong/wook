import "server-only";
import { isPreview } from "./admin";
import { OPEN } from "./open";

// Open (lib/open.ts), or the owner looking as if it were.
export const openNow = async () => OPEN || (await isPreview());
