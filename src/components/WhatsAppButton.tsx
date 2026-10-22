import { MessageCircle } from "lucide-react";
import { site } from "../data/site";

export default function WhatsAppButton() {
  return (
    <a
      href={site.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-green text-white transition-colors hover:bg-green-dark"
      aria-label={`Discuter sur WhatsApp (${site.whatsapp})`}
    >
      <MessageCircle size={22} />
    </a>
  );
}
