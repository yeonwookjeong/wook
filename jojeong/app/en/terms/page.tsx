import type { Metadata } from "next";
import Legal from "@/components/en/Legal";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="10 November 2026">
      <p>These terms apply to the English pages of Hundo Saju (hundosaju.com/en). By using them you agree to these terms.</p>
      <h2>1. What we provide</h2>
      <ul>
        <li>Free previews worked out from the birth details you enter.</li>
        <li>Paid digital readings: written reports delivered on screen right after payment, and the Korean name report.</li>
      </ul>
      <h2>2. What a reading is, and is not</h2>
      <p>
        Saju is a traditional Korean way of interpreting the calendar characters of a birth. Our readings are offered for entertainment, cultural
        interest and self-reflection. They are not predictions, and not medical, legal, financial or psychological advice. Please do not make
        important decisions on a reading alone.
      </p>
      <h2>3. Prices and payment</h2>
      <ul>
        <li>Prices are shown in US dollars on each product page before you pay. Taxes, if any, are shown at checkout.</li>
        <li>Payment is processed by our payment provider. We never see or store your card details.</li>
        <li>A reading opens on screen as soon as payment is complete. Keep the link of your reading to open it again.</li>
      </ul>
      <h2>4. Refunds</h2>
      <p>Refunds follow our Refund Policy.</p>
      <h2>5. Your use</h2>
      <ul>
        <li>Enter birth details only for yourself, or for someone who has agreed to it.</li>
        <li>Readings are for personal use. Do not resell or republish them as your own.</li>
      </ul>
      <h2>6. Changes and contact</h2>
      <p>
        We may update these terms; the date above shows the latest version. Questions: {BUSINESS.email}. These terms are governed by the laws of the Republic of Korea, without
        limiting any consumer rights you have where you live.
      </p>
    </Legal>
  );
}
