import "../styles/FeaturePage.css";

export type TrustTopicId = "trusted-members" | "verified-badge" | "real-people-only";

interface TrustTopicPageProps {
  topic: TrustTopicId;
  onNavigate: (page: string) => void;
  onBack: () => void;
  token?: string | null;
}

interface TopicContent {
  icon: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: { heading: string; text: string }[];
  cta: { label: string; page: string };
}

const topics: Record<TrustTopicId, TopicContent> = {
  "trusted-members": {
    icon: "🤝",
    title: "Trusted Members",
    subtitle: "A community of verified, accountable real people.",
    intro:
      "Every member you see in the verified feed has gone through identity checks, photo validation, and ongoing trust signals. That's the floor — not the ceiling.",
    sections: [
      {
        heading: "Identity verification",
        text: "Members confirm their identity using a government-issued ID before they're allowed into the verified feed. We never display the ID — only the result of the check.",
      },
      {
        heading: "Live photo match",
        text: "A short live selfie is matched against profile photos to confirm the photos are really you, not someone else's pictures from elsewhere on the internet.",
      },
      {
        heading: "Ongoing trust score",
        text: "Reports, blocks, and unmatch patterns continuously feed into a trust score. Members who behave badly are removed from the verified feed.",
      },
      {
        heading: "Manual review",
        text: "Edge cases are reviewed by humans — never auto-approved by AI. We'd rather take a few minutes than let a fake profile through.",
      },
    ],
    cta: { label: "Browse Verified Profiles", page: "verified-profiles" },
  },
  "verified-badge": {
    icon: "✓",
    title: "Verified Badge",
    subtitle: "The green checkmark is earned, not free.",
    intro:
      "When you see a ✓ badge on a profile, it means that person has personally completed identity and photo verification — and is staying in good standing on the platform.",
    sections: [
      {
        heading: "What the badge means",
        text: "The badge confirms three things: a real person's ID was checked, their face matches their photos, and their account is active and in good standing.",
      },
      {
        heading: "What the badge does NOT mean",
        text: "It's not a personality endorsement, a background check, or a guarantee. Always meet in safe public places and trust your instincts.",
      },
      {
        heading: "How to get verified",
        text: "Open Profile → Verify. The flow takes about 2 minutes: photo of your ID, a short live selfie, and you're done. Reviews are usually finished within 24 hours.",
      },
      {
        heading: "Losing the badge",
        text: "If a profile is reported and the trust review finds issues, the badge is removed and the profile leaves the verified feed.",
      },
    ],
    cta: { label: "Verify your own profile", page: "profile" },
  },
  "real-people-only": {
    icon: "🚫🤖",
    title: "Real People Only",
    subtitle: "No bots. No AI companions. No catfishing.",
    intro:
      "Let's Date is built for human connection. We block automated accounts, AI-generated personas, and recycled photos — so every profile in the verified feed is a real, accountable human.",
    sections: [
      {
        heading: "No AI profiles",
        text: "We do not generate, host, or allow AI personas. Every member is a real person who created their own profile and is responsible for their own messages.",
      },
      {
        heading: "Photo originality checks",
        text: "Profile photos are scanned against known scam databases and reverse-image-search providers. Lifted photos from social media or stock-photo libraries are blocked.",
      },
      {
        heading: "Behavioural signals",
        text: "Bot-like behaviour — copy-paste messaging at scale, instant replies, mass-liking — flags accounts for review. Real humans don't move like that.",
      },
      {
        heading: "Easy reporting",
        text: "If something feels off, hit the report button. Our human trust team responds within 24 hours and removes confirmed fake accounts immediately.",
      },
    ],
    cta: { label: "See verified people now", page: "verified-profiles" },
  },
};

const otherTopicIds: Record<TrustTopicId, TrustTopicId[]> = {
  "trusted-members": ["verified-badge", "real-people-only"],
  "verified-badge": ["trusted-members", "real-people-only"],
  "real-people-only": ["trusted-members", "verified-badge"],
};

export function TrustTopicPage({ topic, onNavigate, onBack, token }: TrustTopicPageProps) {
  const data = topics[topic];
  const others = otherTopicIds[topic];

  return (
    <div className="feature-page feature-detail-page">
      <button className="feature-back" onClick={onBack}>
        ← Back to Verified Profiles
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
        <h2>Ready to keep going?</h2>
        <p>
          {token
            ? "You're signed in — pick what you want to do next."
            : "Sign in to use this — clicking will route you through sign-in first."}
        </p>
        <div className="feature-action-buttons">
          <button
            type="button"
            className="feature-action-btn feature-action-btn-primary"
            onClick={() => onNavigate(token ? data.cta.page : "discover")}
          >
            {data.cta.label} →
          </button>
          <button
            type="button"
            className="feature-action-btn feature-action-btn-secondary"
            onClick={() => onNavigate("feature-verified-profiles")}
          >
            Back to Verified Profiles overview
          </button>
        </div>
      </div>

      <div className="feature-related">
        <h2>Other trust topics</h2>
        <div className="feature-related-list">
          {others.map((id) => (
            <button
              key={id}
              type="button"
              className="feature-related-card"
              onClick={() => onNavigate(`trust-${id}`)}
            >
              <span className="feature-related-icon">{topics[id].icon}</span>
              <span className="feature-related-title">{topics[id].title}</span>
              <span className="feature-related-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
