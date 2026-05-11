import "../styles/FeaturePage.css";

export type PageInfoId = "discover" | "matches" | "likes" | "messages" | "profile" | "settings";

interface PageInfoPageProps {
  topic: PageInfoId;
  onNavigate: (page: string) => void;
  onBack: () => void;
  token?: string | null;
}

interface InfoContent {
  icon: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: { heading: string; text: string }[];
  primaryCta: { label: string; page: string };
  secondaryCta?: { label: string; page: string };
}

const content: Record<PageInfoId, InfoContent> = {
  discover: {
    icon: "🔍",
    title: "Discover",
    subtitle: "Browse profiles one at a time and like the people you'd like to meet.",
    intro:
      "Discover is the heart of Let's Date. One real person at a time, full profile, no algorithmic feed games — just a clean ♥ Like or Pass on every card.",
    sections: [
      {
        heading: "One profile at a time",
        text: "No infinite-scroll fatigue. Each card is a real person with photos, age, bio, location, and interests. Take a moment, decide, move on.",
      },
      {
        heading: "Like or Pass",
        text: "♥ likes the person and queues a potential match. Pass moves on without sending a signal. Pass is silent — they won't know.",
      },
      {
        heading: "Filters when you want them",
        text: "Tap the Filters button at the top to narrow by age, distance, and location. For more advanced filters, head to Smart Discovery.",
      },
    ],
    primaryCta: { label: "Open Discover", page: "discover" },
    secondaryCta: { label: "Try Smart Discovery", page: "smart-discovery" },
  },
  matches: {
    icon: "♥",
    title: "Matches",
    subtitle: "Everyone you've connected with — both of you said yes.",
    intro:
      "When you and someone else both ♥ each other, you're a match. They show up here and the conversation can begin.",
    sections: [
      {
        heading: "Two-way only",
        text: "A match means it's mutual. No one-sided lists, no pressure. Both people opted in to this connection.",
      },
      {
        heading: "Filter by recency or favourites",
        text: "Use the All / Recent / Favourites tabs to focus on the matches you want to engage with first.",
      },
      {
        heading: "Message, favourite, or unmatch",
        text: "Each match card has 💬 to start chatting, ♥ to add to favourites, and ✕ to unmatch if it's not a fit. Unmatching removes them from your matches — for both of you.",
      },
    ],
    primaryCta: { label: "Open Matches", page: "matches" },
    secondaryCta: { label: "View Better Matches", page: "better-matches" },
  },
  likes: {
    icon: "💕",
    title: "Likes",
    subtitle: "See who you've liked and who's liked you back.",
    intro:
      "Your ♥ Like history in one place — useful when you want to revisit profiles or see who has shown interest in you.",
    sections: [
      {
        heading: "Likes you've sent",
        text: "Every profile you've ♥-ed appears here. If they like you back, the entry becomes a Match in the Matches tab.",
      },
      {
        heading: "Likes you've received",
        text: "Profiles that have liked you show up too — like them back to instantly create a Match.",
      },
      {
        heading: "No silent rejections",
        text: "We don't show you the people who skipped your profile. You only see Likes — the people who said yes.",
      },
    ],
    primaryCta: { label: "Open Likes", page: "likes" },
    secondaryCta: { label: "Go to Discover", page: "discover" },
  },
  messages: {
    icon: "💬",
    title: "Messages",
    subtitle: "Real-time chat with the real people you've matched with.",
    intro:
      "Messages is where conversations actually happen. Every reply on the other side is a real human typing — no chatbots, no smart-reply bots, no auto-suggestions.",
    sections: [
      {
        heading: "Live conversations",
        text: "Messages deliver in real time over a secure socket connection. Read receipts and online status keep things honest.",
      },
      {
        heading: "Cross-platform with the mobile app",
        text: "A built-in cross-platform chat room lets you talk with people on the mobile app from the web client (and vice versa).",
      },
      {
        heading: "Free vs Premium",
        text: "Free users can send up to 5 messages per day. Premium unlocks unlimited messaging — you can chat with as many people as you want.",
      },
    ],
    primaryCta: { label: "Open Messages", page: "chat" },
    secondaryCta: { label: "Upgrade to Premium", page: "subscribe" },
  },
  profile: {
    icon: "👤",
    title: "Profile",
    subtitle: "Edit your photos, bio, and verification — the version of you everyone else sees.",
    intro:
      "A real, well-built profile attracts real, well-built matches. Spend a few minutes here — it's the highest-leverage thing you can do on the app.",
    sections: [
      {
        heading: "Photos",
        text: "Add 3–6 photos showing your face clearly, what you actually look like, and what you do. Profiles with multiple photos get matched far more often.",
      },
      {
        heading: "Bio",
        text: "A few sentences about who you are and what you're looking for. Specifics beat clichés. Let people see something to talk about.",
      },
      {
        heading: "Verification",
        text: "Get the ✓ verified badge by completing a quick identity + photo check. Verified profiles feature in the Verified Profiles feed and rank higher in Better Matches.",
      },
    ],
    primaryCta: { label: "Open Profile", page: "profile" },
    secondaryCta: { label: "Browse Verified Profiles", page: "verified-profiles" },
  },
  settings: {
    icon: "⚙️",
    title: "Settings",
    subtitle: "Notifications, privacy, account, and subscription — manage how the app works for you.",
    intro:
      "Everything that controls your account in one place. Tweak the parts you want and ignore the parts you don't.",
    sections: [
      {
        heading: "Notifications",
        text: "Toggle email and push notifications for new likes, matches, and messages. Turn off the noise without missing the signal.",
      },
      {
        heading: "Privacy & visibility",
        text: "Choose who can see you, who can message you first, and how your location is used. Control over discoverability is opt-in.",
      },
      {
        heading: "Subscription & account",
        text: "Manage your Free / Premium plan, see usage, switch back to Free, or close your account entirely.",
      },
    ],
    primaryCta: { label: "Open Settings", page: "settings" },
    secondaryCta: { label: "Manage subscription", page: "subscribe" },
  },
};

const allPagesNav: { id: PageInfoId; icon: string; title: string }[] = [
  { id: "discover", icon: "🔍", title: "Discover" },
  { id: "matches", icon: "♥", title: "Matches" },
  { id: "likes", icon: "💕", title: "Likes" },
  { id: "messages", icon: "💬", title: "Messages" },
  { id: "profile", icon: "👤", title: "Profile" },
  { id: "settings", icon: "⚙️", title: "Settings" },
];

export function PageInfoPage({ topic, onNavigate, onBack, token }: PageInfoPageProps) {
  const data = content[topic];
  const others = allPagesNav.filter((p) => p.id !== topic);

  return (
    <div className="feature-page feature-detail-page">
      <button className="feature-back" onClick={onBack}>
        ← Back to Browse
      </button>

      <div className="feature-page-hero">
        <h1>
          {data.icon} {data.title}
        </h1>
        <p>{data.subtitle}</p>
      </div>

      <div className="feature-highlight">
        <p>{data.intro}</p>
      </div>

      <div className="feature-section-list">
        {data.sections.map((s) => (
          <div key={s.heading} className="feature-section-card">
            <h2>{s.heading}</h2>
            <p>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="feature-action">
        <h2>Ready to use it?</h2>
        <p>
          {token
            ? `Jump into ${data.title} now.`
            : `Sign in to use ${data.title} — clicking will route you through sign-in first.`}
        </p>
        <div className="feature-action-buttons">
          <button
            type="button"
            className="feature-action-btn feature-action-btn-primary"
            onClick={() => onNavigate(token ? data.primaryCta.page : "discover")}
          >
            {data.primaryCta.label} →
          </button>
          {data.secondaryCta && (
            <button
              type="button"
              className="feature-action-btn feature-action-btn-secondary"
              onClick={() => onNavigate(token ? data.secondaryCta!.page : "discover")}
            >
              {data.secondaryCta.label}
            </button>
          )}
        </div>
      </div>

      <div className="feature-related">
        <h2>Other sections</h2>
        <div className="feature-related-list">
          {others.map((o) => (
            <button
              key={o.id}
              type="button"
              className="feature-related-card"
              onClick={() => onNavigate(`about-${o.id}`)}
            >
              <span className="feature-related-icon">{o.icon}</span>
              <span className="feature-related-title">{o.title}</span>
              <span className="feature-related-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
