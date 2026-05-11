import "../styles/FeaturePage.css";

type FeatureId =
  | "smart-discovery"
  | "verified-profiles"
  | "real-conversations"
  | "better-matches";

interface FeaturePageProps {
  feature: FeatureId;
  onBack: () => void;
  onNavigate: (page: string) => void;
  token?: string | null;
}

interface CTA {
  label: string;
  page: string;
  variant: "primary" | "secondary";
  signedOutLabel?: string;
}

interface QuickLink {
  label: string;
  page: string;
}

interface FeatureContent {
  title: string;
  subtitle: string;
  intro: string;
  sections: { heading: string; text: string }[];
  humanFocus: string;
  ctas: CTA[];
  quickLinks: QuickLink[];
  related: { id: FeatureId; title: string; icon: string }[];
  externalLink?: { href: string; label: string };
}

const sectionLinks: Partial<Record<FeatureId, Record<string, { page: string; label: string }>>> = {
  "verified-profiles": {
    "Trusted Members": { page: "trust-trusted-members", label: "Learn more →" },
    "Verified Badge": { page: "trust-verified-badge", label: "Learn more →" },
    "Real People Only": { page: "trust-real-people-only", label: "Learn more →" },
  },
  "smart-discovery": {
    "Advanced Filtering": { page: "advanced-filtering", label: "Open filters →" },
  },
};

const sharedQuickLinks: QuickLink[] = [
  { label: "Discover", page: "discover" },
  { label: "Matches", page: "matches" },
  { label: "Likes", page: "likes" },
  { label: "Messages", page: "chat" },
  { label: "Profile", page: "profile" },
  { label: "Settings", page: "settings" },
];

const featureData: Record<FeatureId, FeatureContent> = {
  "smart-discovery": {
    title: "Smart Discovery",
    subtitle: "Thoughtful filters and people-first match recommendations.",
    intro:
      "Find your most compatible matches with intuitive search, shared-interest discovery, and preference-based filtering.",
    sections: [
      {
        heading: "Advanced Filtering",
        text: "Filter by lifestyle, interests, location, and shared values to surface the best profiles quickly.",
      },
      {
        heading: "Shared Interests First",
        text: "Surface real people whose hobbies, values, and chemistry signals line up with yours.",
      },
      {
        heading: "Personalized Insights",
        text: "Get suggestions based on your unique preferences and how you connect over time.",
      },
    ],
    humanFocus:
      "Smart Discovery is built around real people. Every profile you see belongs to a verified human — no bots, no AI-generated companions.",
    ctas: [
      { label: "Open Smart Discovery", page: "smart-discovery", variant: "primary", signedOutLabel: "Sign in to open Smart Discovery" },
      { label: "Update your preferences", page: "settings", variant: "secondary", signedOutLabel: "Sign in to set preferences" },
    ],
    quickLinks: sharedQuickLinks,
    related: [
      { id: "verified-profiles", title: "Verified Profiles", icon: "🛡️" },
      { id: "better-matches", title: "Better Matches", icon: "💞" },
    ],
  },
  "verified-profiles": {
    title: "Verified Profiles",
    subtitle: "Match with authentic, verified members.",
    intro:
      "Feel confident connecting with verified profiles that have gone through identity and trust checks.",
    sections: [
      {
        heading: "Trusted Members",
        text: "Only verified users appear in this section, giving you a safer and higher-quality matching experience.",
      },
      {
        heading: "Verified Badge",
        text: "Profiles display verification badges after identity and photo validation.",
      },
      {
        heading: "Real People Only",
        text: "Strict identity checks keep fake profiles out so every match is a real human.",
      },
    ],
    humanFocus:
      "Identity verification, manual review, and photo validation help ensure every person you meet is real — never a bot or AI.",
    ctas: [
      { label: "Open Verified Profiles", page: "verified-profiles", variant: "primary", signedOutLabel: "Sign in to view verified profiles" },
      { label: "Verify your profile", page: "profile", variant: "secondary", signedOutLabel: "Sign in to verify your profile" },
    ],
    quickLinks: sharedQuickLinks,
    related: [
      { id: "smart-discovery", title: "Smart Discovery", icon: "🔍" },
      { id: "better-matches", title: "Better Matches", icon: "💞" },
    ],
  },
  "real-conversations": {
    title: "Real Conversations",
    subtitle: "Connect instantly with real-time chat.",
    intro:
      "Start meaningful conversations in real time with people who are actually on the other side of the chat.",
    sections: [
      {
        heading: "Instant Messaging",
        text: "Send messages, share feelings, and respond faster with live chat support.",
      },
      {
        heading: "Real Replies",
        text: "Every message is written by a real person — no auto-replies, no generated responses.",
      },
      {
        heading: "Secure Connections",
        text: "Your conversations stay private and safe while you explore new connections.",
      },
    ],
    humanFocus:
      "Conversations on Let's Date are 100% human-to-human. No chatbots, no smart-reply bots — just genuine messages from real people.",
    ctas: [
      { label: "Open chats", page: "chat", variant: "primary", signedOutLabel: "Sign in to open chats" },
      { label: "View matches", page: "matches", variant: "secondary", signedOutLabel: "Sign in to view matches" },
    ],
    quickLinks: sharedQuickLinks,
    related: [
      { id: "verified-profiles", title: "Verified Profiles", icon: "🛡️" },
      { id: "smart-discovery", title: "Smart Discovery", icon: "🔍" },
    ],
    externalLink: { href: "https://play.google.com/store/search?q=lets%20date&c=apps", label: "Find us on Google Play" },
  },
  "better-matches": {
    title: "Better Matches",
    subtitle: "Genuine compatibility for stronger connections.",
    intro:
      "Match with people who share your values, interests, and long-term goals through transparent, people-first recommendations.",
    sections: [
      {
        heading: "Compatibility Scoring",
        text: "Your shared values, conversation style, and relationship goals help surface better matches.",
      },
      {
        heading: "Personality Insights",
        text: "Understand how your personality fits with other members for more meaningful matches.",
      },
      {
        heading: "Continuous Learning",
        text: "Recommendations adapt as you interact with real people and give feedback.",
      },
    ],
    humanFocus:
      "Better Matches is grounded in real human connection — recommendations are based on your interactions with real people, not artificial profiles.",
    ctas: [
      { label: "Open Better Matches", page: "better-matches", variant: "primary", signedOutLabel: "Sign in to see your better matches" },
      { label: "Update your profile", page: "profile", variant: "secondary", signedOutLabel: "Sign in to update your profile" },
    ],
    quickLinks: sharedQuickLinks,
    related: [
      { id: "smart-discovery", title: "Smart Discovery", icon: "🔍" },
      { id: "real-conversations", title: "Real Conversations", icon: "💬" },
    ],
  },
};

export function FeaturePage({ feature, onBack, onNavigate, token }: FeaturePageProps) {
  const data = featureData[feature];
  const handleCta = (cta: CTA) => {
    if (cta.page.startsWith("http://") || cta.page.startsWith("https://")) {
      window.open(cta.page, "_blank", "noopener,noreferrer");
      return;
    }
    onNavigate(token ? cta.page : "discover");
  };

  return (
    <div className="feature-page feature-detail-page">
      <button className="feature-back" onClick={onBack}>
        ← Back to all features
      </button>
      <div className="feature-page-hero">
        <h1>{data.title}</h1>
        <p>{data.subtitle}</p>
      </div>

      <div className="feature-highlight">
        <p>{data.intro}</p>
      </div>


      <div className="feature-section-list">
        {data.sections.map((section) => {
          const link = sectionLinks[feature]?.[section.heading];
          if (link) {
            return (
              <button
                key={section.heading}
                type="button"
                className="feature-section-card feature-section-card-link"
                onClick={() => onNavigate(token ? link.page : "discover")}
              >
                <h2>{section.heading}</h2>
                <p>{section.text}</p>
                <span className="feature-section-link">{link.label}</span>
              </button>
            );
          }
          return (
            <div key={section.heading} className="feature-section-card">
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
            </div>
          );
        })}
      </div>

      <div className="feature-human-panel">
        <h2>100% Human</h2>
        <p>{data.humanFocus}</p>
      </div>

      <div className="feature-action">
        <h2>{token ? "Try it now" : "Sign in to get started"}</h2>
        <p>
          {token
            ? "Jump straight into the app and start meeting real people."
            : "Create an account or sign in to use this feature with real people."}
        </p>
        <div className="feature-action-buttons">
          {data.ctas.map((cta) => {
            const isExternal = cta.page.startsWith("http://") || cta.page.startsWith("https://");
            return (
              <button
                key={cta.label}
                type="button"
                className={`feature-action-btn feature-action-btn-${cta.variant}`}
                onClick={() => handleCta(cta)}
              >
                {token ? cta.label : cta.signedOutLabel ?? cta.label}
                {" "}
                {isExternal ? "↗" : "→"}
              </button>
            );
          })}
          {data.externalLink && (
            <a
              href={data.externalLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="feature-action-btn feature-action-btn-external"
            >
              {data.externalLink.label} ↗
            </a>
          )}
        </div>
      </div>

      <div className="feature-related">
        <h2>Explore related features</h2>
        <div className="feature-related-list">
          {data.related.map((rel) => (
            <button
              key={rel.id}
              type="button"
              className="feature-related-card"
              onClick={() => onNavigate(`feature-${rel.id}`)}
            >
              <span className="feature-related-icon">{rel.icon}</span>
              <span className="feature-related-title">{rel.title}</span>
              <span className="feature-related-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
