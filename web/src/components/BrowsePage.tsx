import "../styles/BrowsePage.css";

interface BrowsePageProps {
  onNavigate: (page: string) => void;
}

interface BrowseLink {
  icon: string;
  title: string;
  page: string;
  infoPage: string;
  description: string;
  external?: boolean;
}

const links: BrowseLink[] = [
  {
    icon: "🔍",
    title: "Discover",
    page: "discover",
    infoPage: "about-discover",
    description: "Browse profiles one by one and like the people you'd like to meet.",
  },
  {
    icon: "♥",
    title: "Matches",
    page: "matches",
    infoPage: "about-matches",
    description: "Everyone you've connected with — start a conversation or add favourites.",
  },
  {
    icon: "💕",
    title: "Likes",
    page: "likes",
    infoPage: "about-likes",
    description: "See who you've liked and who's liked you back.",
  },
  {
    icon: "💬",
    title: "Messages",
    page: "chat",
    infoPage: "about-messages",
    description: "Real-time chat with the people you've matched with.",
  },
  {
    icon: "👤",
    title: "Profile",
    page: "profile",
    infoPage: "about-profile",
    description: "Edit your photos, bio, and verification status.",
  },
  {
    icon: "⚙️",
    title: "Settings",
    page: "settings",
    infoPage: "about-settings",
    description: "Notifications, privacy, account, and subscription.",
  },
  {
    icon: "🔍",
    title: "Smart Discovery",
    page: "smart-discovery",
    infoPage: "feature-smart-discovery",
    description: "Discover with age, distance, location, and interest filters.",
  },
  {
    icon: "🛡️",
    title: "Verified Profiles",
    page: "verified-profiles",
    infoPage: "feature-verified-profiles",
    description: "Browse only identity-verified, real human profiles.",
  },
  {
    icon: "💬",
    title: "Real Conversations",
    page: "real-conversations",
    infoPage: "feature-real-conversations",
    description: "Chat with the real people you've matched with.",
  },
  {
    icon: "💞",
    title: "Better Matches",
    page: "better-matches",
    infoPage: "feature-better-matches",
    description: "New people, ranked by compatibility — score, online, interests.",
  },
];

export function BrowsePage({ onNavigate }: BrowsePageProps) {
  return (
    <div className="browse-page">
      <header className="browse-hero">
        <span className="browse-eyebrow">All sections</span>
        <h1>Browse the app</h1>
        <p>Every page in Let's Date — pick where you want to go.</p>
      </header>

      <ul className="browse-grid">
        {links.map((link) => (
          <li key={link.page} className="browse-card-shell">
            <button
              type="button"
              className="browse-card"
              onClick={() =>
                link.external
                  ? window.open(link.page, "_blank", "noopener,noreferrer")
                  : onNavigate(link.page)
              }
            >
              <span className="browse-card-icon">{link.icon}</span>
              <span className="browse-card-body">
                <span className="browse-card-title">
                  {link.title}
                  <span className="browse-card-arrow">{link.external ? "↗" : "→"}</span>
                </span>
                <span className="browse-card-description">{link.description}</span>
              </span>
            </button>
            <button
              type="button"
              className="browse-card-info"
              onClick={() => onNavigate(link.infoPage)}
            >
              Learn more →
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
