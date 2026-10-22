import { MessageCircle } from "lucide-react";
import { site } from "../data/site";

const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
  </svg>
);

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
  </svg>
);

const YouTubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
  </svg>
);

const LinkedInIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => <MessageCircle size={size} />;

const socialLinks = [
  { name: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
  { name: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { name: "TikTok", href: site.social.tiktok, Icon: TikTokIcon },
  { name: "YouTube", href: site.social.youtube, Icon: YouTubeIcon },
  { name: "LinkedIn", href: site.social.linkedin, Icon: LinkedInIcon },
  { name: "WhatsApp", href: site.whatsappHref, Icon: WhatsAppIcon },
];

type Props = {
  variant?: "light" | "dark";
  bordered?: boolean;
  size?: "sm" | "lg";
  className?: string;
};

export default function SocialIcons({
  variant = "light",
  bordered = false,
  size = "sm",
  className = "",
}: Props) {
  const dimensions = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconSize = size === "lg" ? 20 : 16;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socialLinks.map(({ name, href, Icon }) => {
        const base = `flex ${dimensions} items-center justify-center rounded-md transition-colors`;
        const borderedCls = bordered
          ? variant === "dark"
            ? "border border-white/15 text-white/70 hover:border-gold hover:text-gold"
            : "border border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-white"
          : variant === "dark"
            ? "text-white/70 hover:text-gold"
            : "text-ink/75 hover:text-gold-dark";

        if (!href) {
          return (
            <span
              key={name}
              role="img"
              aria-label={name}
              title={name}
              className={`${base} ${borderedCls} opacity-55`}
            >
              <Icon size={iconSize} />
            </span>
          );
        }

        const external = href.startsWith("http");
        return (
          <a
            key={name}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={`${name} ${site.shortName}`}
            className={`${base} ${borderedCls}`}
          >
            <Icon size={iconSize} />
          </a>
        );
      })}
    </div>
  );
}
