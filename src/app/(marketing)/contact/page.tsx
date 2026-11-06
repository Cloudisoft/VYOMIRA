import { ContentPage } from "@/components/layout/ContentPage";
import { COMPANY, telHref } from "@/lib/company";

export const metadata = { title: "Contact & support" };

export default function Contact() {
  return (
    <ContentPage eyebrow="Support" title="We're here to help." intro="For account, billing, privacy or data requests, write to us and include the email you signed up with. Please don't send birth details by email — we can see what we need from your account.">
      <ul>
        <li>Email: <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></li>
        <li>Phone / WhatsApp: <a href={telHref()}>{COMPANY.phone}</a> (Mon–Sat, 10:00–19:00 IST)</li>
        {COMPANY.privacyEmail !== COMPANY.supportEmail && <li>Privacy & data requests: <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a></li>}
        <li>Grievance Officer: see <a href="/legal/grievance">Grievance Redressal</a></li>
      </ul>
      <p>We reply to emails within 2 business days.</p>
      <p>If you are in distress, please contact Tele-MANAS on 14416 (India, free, 24×7), call 112 in an emergency, or find a helpline in your country at findahelpline.com.</p>
    </ContentPage>
  );
}
