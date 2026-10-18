import { MessageCircle } from "lucide-react";
import { site } from "../data/site";

export default function WhatsAppButton() {
  return (
    <a
      href={site.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green text-white shadow-lg shadow-green/30 flex items-center justify-center hover:bg-green-dark transition-colors"
      aria-label={`Discuter sur WhatsApp (${site.whatsapp})`}
    >
      <MessageCircle size={26} />
    </a>
  );
}
