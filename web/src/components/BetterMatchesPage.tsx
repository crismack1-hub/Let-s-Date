import { useEffect, useState } from "react";
import { UserProfile } from "../types";
import "../styles/FeaturePages.css";

interface BetterMatchesPageProps {
  token: string;
  onNavigate: (page: string) => void;
}

function compatibilityScore(u: UserProfile): number {
  let score = 50;
  if (u.verified) score += 15;
  if (u.online) score += 5;
  if (u.bio) score += Math.min(10, u.bio.length / 20);
  if (u.interests?.length) score += Math.min(15, u.interests.length * 2);
  return Math.min(99, Math.round(score));
}

const matchFactors = [
  {
    icon: "🛡️",
    title: "Verified identity",
    text: "Identity-checked profiles get a boost so you're matching with real, accountable people.",
    weight: "+15 pts",
  },
  {
    icon: "🎯",
    title: "Shared interests",
    text: "Hobbies, values and lifestyle overlap — the more you have in common, the higher the score.",
    weight: "up to +15 pts",
  },
  {
    icon: "📝",
    title: "Profile depth",
    text: "A thoughtful bio shows someone is genuinely looking. Effort matters.",
    weight: "up to +10 pts",
  },
  {
    icon: "🟢",
    title: "Active right now",
    text: "Recently active people are more likely to actually reply when you message them.",
    weight: "+5 pts",
  },
  {
    icon: "📍",
    title: "Location compatibility",
    text: "We weight matches in your distance preference so you can actually meet in person.",
    weight: "baseline",
  },
];

export function BetterMatchesPage({ token, onNavigate }: BetterMatchesPageProps) {
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "online">("score");
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:4000/api/discover", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setPeople(await res.json());
      } catch (e) {
        console.error("better-matches fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleLike = async (userId: string) => {
    try {
      const res = await fetch("http://localhost:4000/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: userId }),
      });
      if (res.ok) setLikedIds((prev) => [...prev, userId]);
    } catch (e) {
      console.error(e);
    }
  };

  const sorted = [...people].sort((a, b) => {
    if (sortBy === "online") {
      const onlineDelta = Number(b.online) - Number(a.online);
      if (onlineDelta !== 0) return onlineDelta;
    }
    return compatibilityScore(b) - compatibilityScore(a);
  });

  return (
    <div className="feature-functional-page">
      <header className="feature-functional-hero feature-hero-matches">
        <div>
          <span className="feature-hero-eyebrow">💞 Better Matches</span>
          <h1>New people, ranked by compatibility</h1>
          <p>
            Fresh profiles you haven't met yet — sorted by shared interests, verification, and how
            engaged they are. Like the ones who feel right.
          </p>
        </div>
      </header>

      <section className="match-factors">
        <header className="match-factors-header">
          <h2>What makes people match</h2>
          <p>Compatibility scores are built from real signals from real people. Here's what counts:</p>
        </header>
        <ul className="match-factors-list">
          {matchFactors.map((f) => (
            <li key={f.title} className="match-factor">
              <span className="match-factor-icon">{f.icon}</span>
              <div className="match-factor-body">
                <div className="match-factor-row">
                  <h3>{f.title}</h3>
                  <span className="match-factor-weight">{f.weight}</span>
                </div>
                <p>{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="feature-controls feature-controls-row">
        <button
          type="button"
          className={`feature-tab ${sortBy === "score" ? "active" : ""}`}
          onClick={() => setSortBy("score")}
        >
          By compatibility
        </button>
        <button
          type="button"
          className={`feature-tab ${sortBy === "online" ? "active" : ""}`}
          onClick={() => setSortBy("online")}
        >
          Online first
        </button>
        <button
          type="button"
          className="feature-secondary-link"
          onClick={() => onNavigate("smart-discovery")}
        >
          Open Smart Discovery →
        </button>
      </div>

      <div className="feature-content-area">
        {loading ? (
          <p>Loading new people…</p>
        ) : !sorted.length ? (
          <div className="feature-empty">
            <p>No new people to suggest right now. Check back soon, or open Smart Discovery.</p>
            <button
              type="button"
              className="feature-primary-btn"
              onClick={() => onNavigate("smart-discovery")}
            >
              Open Smart Discovery →
            </button>
          </div>
        ) : (
          <div className="matches-strength-grid">
            {sorted.map((u) => {
              const score = compatibilityScore(u);
              const liked = likedIds.includes(u.id);
              return (
                <article key={u.id} className="match-strength-card">
                  <div className="match-strength-photo">
                    {u.photos?.[0] && <img src={u.photos[0]} alt={u.name} />}
                    {u.verified && <span className="verified-card-badge small">✓</span>}
                    {u.online && <span className="online-pill">● Online</span>}
                  </div>
                  <div className="match-strength-body">
                    <h3>
                      {u.name}, {u.age}
                    </h3>
                    <p className="verified-location">{u.location}</p>
                    {u.bio && <p className="verified-bio">{u.bio.substring(0, 90)}…</p>}
                    {u.interests?.length ? (
                      <div className="strength-interests">
                        {u.interests.slice(0, 3).map((i) => (
                          <span key={i} className="strength-interest-chip">
                            {i}
                          </span>
                        ))}
                        {u.interests.length > 3 && (
                          <span className="strength-interest-more">
                            +{u.interests.length - 3}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div className="strength-bar">
                      <div className="strength-fill" style={{ width: `${score}%` }} />
                      <span className="strength-label">{score}% match</span>
                    </div>
                    <div className="match-strength-actions">
                      <button
                        type="button"
                        className="feature-primary-btn small"
                        onClick={() => handleLike(u.id)}
                        disabled={liked}
                      >
                        {liked ? "♥ Liked" : "♥ Like"}
                      </button>
                      <button
                        type="button"
                        className="feature-secondary-btn small"
                        onClick={() => onNavigate("chat")}
                      >
                        💬 Message
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
