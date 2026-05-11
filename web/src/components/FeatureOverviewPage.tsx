import { QuickNav } from "./QuickNav";
import "../styles/FeaturePage.css";

interface FeatureOverviewPageProps {
  onViewFeature: (page: string) => void;
}

const features = [
  {
    id: "smart-discovery",
    title: "Smart Discovery",
    description: "Use thoughtful filters and shared interests to find genuine compatibility faster.",
    icon: "🔍",
  },
  {
    id: "verified-profiles",
    title: "Verified Profiles",
    description: "Connect only with authenticated profiles to keep your matches real.",
    icon: "🛡️",
  },
  {
    id: "real-conversations",
    title: "Real Conversations",
    description: "Start instant messaging with real people and experience live chat features.",
    icon: "💬",
  },
  {
    id: "better-matches",
    title: "Better Matches",
    description: "Real compatibility based on shared values and interests for more meaningful matches.",
    icon: "🎯",
  },
];

export function FeatureOverviewPage({ onViewFeature }: FeatureOverviewPageProps) {
  return (
    <div className="feature-page">
      <div className="feature-page-hero">
        <h1>Real People. Real Connections.</h1>
        <p>
          Let's Date is 100% human — no bots, no AI. Just real people looking for genuine
          conversation and meaningful matches.
        </p>
      </div>

      <div className="feature-cards">
        {features.map((feature) => (
          <button
            key={feature.id}
            className="feature-card"
            onClick={() => onViewFeature(`feature-${feature.id}`)}
          >
            <span className="feature-icon">{feature.icon}</span>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
          </button>
        ))}
      </div>

      <QuickNav
        title="Go straight to a section"
        description="Jump to any part of the app."
        onNavigate={onViewFeature}
      />
    </div>
  );
}
