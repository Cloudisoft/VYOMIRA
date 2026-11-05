import { ContentPage } from "@/components/layout/ContentPage";
export const metadata = { title: "Contact & support" };
export default function Contact() {
  return (
    <ContentPage eyebrow="Support" title="We're here to help." intro="For account, billing, privacy or data requests, write to us and include the email you signed up with. Please don't send birth details by email — we can see what we need from your account.">
      <ul>
        <li>Support & billing: <a href="mailto:support@vyomira.app">support@vyomira.app</a></li>
        <li>Privacy & data requests: <a href="mailto:privacy@vyomira.app">privacy@vyomira.app</a></li>
        <li>Grievance Officer (India): to be appointed before launch — see Privacy Notice.</li>
      </ul>
      <p>If you are in distress, please contact Tele-MANAS on 14416 (India, free, 24×7), call 112 in an emergency, or find a helpline in your country at findahelpline.com.</p>
    </ContentPage>
  );
}
