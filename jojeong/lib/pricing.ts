import "server-only";
import { isPreview } from "./admin";
import { PRICING_A_LIVE, type Pricing } from "./products";

// Which prices this visitor sees and pays: A안 once it is live, and already for the owner in 시안 모드.
export const pricingNow = async (): Promise<Pricing> => (PRICING_A_LIVE || (await isPreview()) ? "a" : "old");
