import type { Metadata } from "next";
import Legal from "@/components/en/Legal";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Refund Policy" };

export default function Refund() {
  return (
    <Legal title="Refund Policy" updated="10 November 2026">
      <p>
        Our readings are digital content that opens on screen as soon as you pay. Before paying, you can see each reading&apos;s full list of
        chapters, a free preview of your own chart, and a sample reading.
      </p>
      <h2>Full refund</h2>
      <ul>
        <li>You paid but your reading never opened (for example, the page closed during payment or an error stopped it): within 7 days of payment.</li>
        <li>An error on our side stopped the reading from opening, or you were charged a different amount from the price shown.</li>
        <li>You were charged twice for the same reading.</li>
        <li>The reading you received does not match the chapters described on the product page: within 3 months of purchase.</li>
      </ul>
      <h2>When we cannot refund</h2>
      <p>
        Once a reading has opened and been delivered as described, we cannot refund it simply because you changed your mind or disagree with the
        interpretation, as the content has already been provided in full. This does not limit any rights you have under the consumer laws where
        you live.
      </p>
      <h2>How to ask</h2>
      <p>
        Email {BUSINESS.email} with the date of payment, the amount, and the name of the reading. We reply within 3 business days. Refunds go back
        to the original payment method; your bank may take 3 to 10 business days to show it.
      </p>
    </Legal>
  );
}
