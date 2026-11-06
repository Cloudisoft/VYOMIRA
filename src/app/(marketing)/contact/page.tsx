import { ContentPage } from "@/components/layout/ContentPage";
import { ContactForm } from "@/components/support/ContactForm";
import { COMPANY, telHref, whatsappHref } from "@/lib/company";

export const metadata = { title: "Contact & support" };

export default function Contact() {
  return (
    <ContentPage eyebrow="Support" title="We're here to help." intro="Questions about your chart, billing, your account or privacy — send us a message, chat on WhatsApp, or call. Please don't send birth details; we can see what we need from your account.">
      <ContactForm />
      <h2>Other ways to reach us</h2>
      <ul>
        <li>WhatsApp: <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a> ({COMPANY.phone})</li>
        <li>Phone: <a href={telHref()}>{COMPANY.phone}</a> (Mon–Sat, 10:00–19:00 IST)</li>
        <li>Email: <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a></li>
        <li>Grievance Officer: see <a href="/legal/grievance">Grievance Redressal</a></li>
      </ul>
      <p>We reply within 2 business days.</p>
      <p>If you are in distress, please contact Tele-MANAS on 14416 (India, free, 24×7), call 112 in an emergency, or find a helpline in your country at findahelpline.com.</p>
    </ContentPage>
  );
}
