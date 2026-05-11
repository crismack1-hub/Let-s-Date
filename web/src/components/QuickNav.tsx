import "../styles/QuickNav.css";

export interface QuickNavLink {
  label: string;
  page: string;
  icon: string;
  external?: boolean;
}

export const defaultQuickNavLinks: QuickNavLink[] = [
  { label: "Discover", page: "discover", icon: "🔍" },
  { label: "Matches", page: "matches", icon: "♥" },
  { label: "Likes", page: "likes", icon: "💕" },
  { label: "Messages", page: "chat", icon: "💬" },
  { label: "Profile", page: "profile", icon: "👤" },
  { label: "Settings", page: "settings", icon: "⚙️" },
  { label: "Smart Discovery", page: "smart-discovery", icon: "🔍" },
  { label: "Verified Profiles", page: "verified-profiles", icon: "🛡️" },
  { label: "Real Conversations", page: "real-conversations", icon: "💬" },
  { label: "Better Matches", page: "better-matches", icon: "💞" },
  { label: "Subscribe", page: "subscribe", icon: "★" },
];

interface QuickNavProps {
  title?: string;
  description?: string;
  onNavigate: (page: string) => void;
  links?: QuickNavLink[];
  variant?: "card" | "inline";
}

export function QuickNav({
  title,
  description,
  onNavigate,
  links = defaultQuickNavLinks,
  variant = "card",
}: QuickNavProps) {
  return (
    <section className={`quick-nav quick-nav-${variant}`}>
      {title && <h2 className="quick-nav-title">{title}</h2>}
      {description && <p className="quick-nav-description">{description}</p>}
      <ul className="quick-nav-list">
        {links.map((link) => (
          <li key={link.page}>
            {link.external ? (
              <a
                href={link.page}
                target="_blank"
                rel="noopener noreferrer"
                className="quick-nav-link"
              >
                <span className="quick-nav-icon">{link.icon}</span>
                <span className="quick-nav-label">{link.label}</span>
                <span className="quick-nav-arrow">↗</span>
              </a>
            ) : (
              <button
                type="button"
                className="quick-nav-link"
                onClick={() => onNavigate(link.page)}
              >
                <span className="quick-nav-icon">{link.icon}</span>
                <span className="quick-nav-label">{link.label}</span>
                <span className="quick-nav-arrow">→</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
