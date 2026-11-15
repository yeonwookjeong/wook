import { Review } from "@apps-in-toss/web-framework";
import { addToList, readList } from "./me";

// A review is asked for once on this phone, right after a good moment (a report read to its end, a 신살 card
// opened): reviews count toward the 추천 미니앱 grade (the exposure policy from 2026-10-22). Toss decides whether the
// sheet actually shows.
const ASKED_KEY = "hundo:review-asked";

export function askReviewOnce() {
  void (async () => {
    try {
      if (!Review.request.isSupported() || (await readList(ASKED_KEY)).length) return;
      await addToList(ASKED_KEY, new Date().toISOString());
      await Review.request();
    } catch {
      // A review sheet that does not open changes nothing.
    }
  })();
}
