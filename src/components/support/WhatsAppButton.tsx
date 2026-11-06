import { COMPANY, whatsappHref } from "@/lib/company";

/** Floating "Chat on WhatsApp" button (bottom-right). */
export function WhatsAppButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with us on WhatsApp (${COMPANY.phone})`}
      className={`group fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,.6)] transition-transform duration-300 hover:scale-105 sm:right-6 sm:bottom-6 ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M16.04 3C8.85 3 3 8.83 3 16c0 2.29.6 4.53 1.75 6.5L3 29l6.68-1.74A13 13 0 0 0 16.04 29C23.22 29 29 23.17 29 16S23.22 3 16.04 3Zm0 23.8c-2.02 0-4-.54-5.72-1.57l-.41-.24-3.96 1.03 1.06-3.86-.27-.4A10.73 10.73 0 0 1 5.24 16c0-5.95 4.85-10.8 10.8-10.8 5.94 0 10.76 4.85 10.76 10.8s-4.82 10.8-10.76 10.8Zm5.92-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.51-.16-.73.16-.21.32-.84 1.06-1.03 1.27-.19.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.15-.14.32-.38.48-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.12 1.32 3.33.16.22 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.77.25 1.48.21 2.03.13.62-.09 1.92-.78 2.19-1.54.27-.75.27-1.4.19-1.53-.08-.14-.3-.22-.62-.38Z" />
      </svg>
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[10rem] sm:inline">Chat with us</span>
    </a>
  );
}
