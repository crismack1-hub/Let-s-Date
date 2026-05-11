import { useState } from "react";
import { useSubscription, FREE_DAILY_MESSAGE_LIMIT } from "../hooks/useSubscription";
import "../styles/SubscribePage.css";

interface SubscribePageProps {
  onNavigate: (page: string) => void;
}

const freeFeatures = [
  "Browse Discover & Verified Profiles",
  "See your Matches and Likes",
  `Send up to ${FREE_DAILY_MESSAGE_LIMIT} messages per day`,
  "Smart Discovery filters (age, distance, location)",
];

const premiumFeatures = [
  "Unlimited messaging — chat without daily limits",
  "Real Conversations with everyone you match",
  "Priority placement in Smart Discovery",
  "Unlock all interest filters",
  "Better Matches with full compatibility insights",
  "Cancel anytime",
];

export function SubscribePage({ onNavigate }: SubscribePageProps) {
  const { state, isPremium, subscribe, cancel, messagesUsedToday, messagesLeftToday } =
    useSubscription();
  const [confirming, setConfirming] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const handleSubscribe = () => {
    setConfirming(true);
    setTimeout(() => {
      subscribe();
      setConfirming(false);
    }, 600);
  };

  return (
    <div className="subscribe-page">
      <header className="subscribe-hero">
        <span className="subscribe-eyebrow">Plans</span>
        <h1>Pick the plan that fits how you date</h1>
        <p>
          Both plans give you access to real people on Let's Date. Premium removes the daily
          message cap so you can talk to everyone you match with.
        </p>
        {!isPremium && messagesLeftToday !== Infinity && (
          <div className="subscribe-usage">
            Today: <strong>{messagesUsedToday}</strong> / {FREE_DAILY_MESSAGE_LIMIT} messages used —{" "}
            <strong>{messagesLeftToday}</strong> left
          </div>
        )}
      </header>

      <div className="subscribe-tiers">
        <article className={`tier-card ${!isPremium ? "is-current" : ""}`}>
          <div className="tier-head">
            <h2>Free</h2>
            <p className="tier-tag">Always free</p>
          </div>
          <div className="tier-price">
            <span className="tier-amount">$0</span>
            <span className="tier-cycle">/ month</span>
          </div>
          <ul className="tier-features">
            {freeFeatures.map((f) => (
              <li key={f}>
                <span className="tier-check">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {!isPremium ? (
            <div className="tier-current-pill">Current plan</div>
          ) : (
            <button
              type="button"
              className="tier-btn tier-btn-secondary"
              onClick={() => setShowCancel(true)}
            >
              Switch back to Free
            </button>
          )}
        </article>

        <article className={`tier-card tier-premium ${isPremium ? "is-current" : ""}`}>
          <div className="tier-badge">Most popular</div>
          <div className="tier-head">
            <h2>Premium</h2>
            <p className="tier-tag">Unlimited messaging</p>
          </div>
          <div className="tier-price">
            <span className="tier-amount">$9.99</span>
            <span className="tier-cycle">/ month</span>
          </div>
          <ul className="tier-features">
            {premiumFeatures.map((f) => (
              <li key={f}>
                <span className="tier-check tier-check-premium">★</span>
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <>
              <div className="tier-current-pill tier-current-pill-premium">Active</div>
              {state.renewsAt && (
                <p className="tier-renews">
                  Renews {new Date(state.renewsAt).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              className="tier-btn tier-btn-primary"
              onClick={handleSubscribe}
              disabled={confirming}
            >
              {confirming ? "Processing…" : "Upgrade to Premium"}
            </button>
          )}
        </article>
      </div>

      <p className="subscribe-disclaimer">
        Demo mode — no real charge is made. Subscription state is stored locally and can be cancelled
        any time.
      </p>

      <div className="subscribe-jump">
        <button type="button" className="subscribe-link" onClick={() => onNavigate("real-conversations")}>
          See Real Conversations →
        </button>
        <button type="button" className="subscribe-link" onClick={() => onNavigate("settings")}>
          Manage in Settings →
        </button>
      </div>

      {showCancel && (
        <div className="subscribe-modal" onClick={() => setShowCancel(false)}>
          <div className="subscribe-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Switch back to Free?</h3>
            <p>You'll lose unlimited messaging and go back to {FREE_DAILY_MESSAGE_LIMIT} messages per day.</p>
            <div className="subscribe-modal-actions">
              <button
                type="button"
                className="tier-btn tier-btn-secondary"
                onClick={() => setShowCancel(false)}
              >
                Keep Premium
              </button>
              <button
                type="button"
                className="tier-btn tier-btn-danger"
                onClick={() => {
                  cancel();
                  setShowCancel(false);
                }}
              >
                Switch to Free
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
