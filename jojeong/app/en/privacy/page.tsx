import type { Metadata } from "next";
import Legal from "@/components/en/Legal";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="10 November 2026">
      <p>We collect as little as we can. The short version: your birth date is used once to work out your chart, and it is never stored.</p>
      <h2>What you enter, and what we keep</h2>
      <ul>
        <li>First name, gender, date, time and city of birth: used on our server to work out the eight characters of your chart. The date and time themselves are not stored.</li>
        <li>What we keep is the chart: your first name, the eight characters, gender, birth year and ten-year cycles. It travels in your reading&apos;s link and, for a paid reading, is kept with your order so the reading can open again.</li>
        <li>A paid reading&apos;s text is stored so you can reopen it from its link.</li>
      </ul>
      <h2>Payment</h2>
      <p>Payments are handled by our payment provider. We receive the order number, amount and status, never your card details.</p>
      <h2>Analytics and cookies</h2>
      <p>
        We use cookieless page-view counting (Vercel Web Analytics) and Microsoft Clarity to understand which pages work. Clarity may set
        cookies; it does not receive your birth details. We do not sell personal data or use it for advertising profiles.
      </p>
      <h2>How long we keep it</h2>
      <p>Order records are kept as long as the law requires for commerce records (up to 5 years in Korea). You can ask us to delete anything else at any time.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete what we hold about you by emailing {BUSINESS.email}. We answer within 10 days.</p>
    </Legal>
  );
}
