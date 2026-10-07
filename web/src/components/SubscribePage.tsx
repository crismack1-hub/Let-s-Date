import "../styles/SubscribePage.css";

interface SubscribePageProps {
  onNavigate: (page: string) => void;
}

export function SubscribePage({ onNavigate }: SubscribePageProps) {
  return (
    <div className="subscribe-page">
      <header className="subscribe-hero">
        <span className="subscribe-eyebrow">Testing phase</span>
        <h1>Everything is free on Connect</h1>
        <p>
          Explore every feature, send unlimited messages, and test the full experience. There are no
          subscriptions, tokens, or charges during testing.
        </p>
      </header>

      <div className="subscribe-tiers">
        <article className="tier-card is-current">
          <div className="tier-head">
            <h2>Free testing access</h2>
            <p className="tier-tag">No tokens. No limits. No charges.</p>
          </div>
          <ul className="tier-features">
            {[
              "Unlimited messaging, calls, and voice notes",
              "All discovery and matching features unlocked",
              "All filters and profile tools available",
              "Free for the full testing phase",
            ].map((feature) => (
              <li key={feature}>
                <span className="tier-check">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="tier-current-pill">Active for all testers</div>
        </article>
      </div>

      <div className="subscribe-jump">
        <button type="button" className="subscribe-link" onClick={() => onNavigate("settings")}>
          Manage in Settings →
        </button>
      </div>

    </div>
  );
}
