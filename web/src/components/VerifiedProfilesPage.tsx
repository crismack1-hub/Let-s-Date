import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import "../styles/FeaturePages.css";

interface VerifiedProfilesPageProps {
  token: string;
  onNavigate: (page: string) => void;
}

export function VerifiedProfilesPage({ token, onNavigate }: VerifiedProfilesPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/api/discover`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("verified-profiles fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: string) => {
    try {
      await fetch(`http://localhost:4000/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: userId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const visible = users.filter((u) => u.verified);
  const featured = visible[0];
  const onlineNow = visible.filter((u) => u.online && u.id !== featured?.id);
  const rest = visible.filter((u) => u.id !== featured?.id);

  return (
    <div className="feature-functional-page verified-layout">
      <header className="feature-functional-hero feature-hero-verified">
        <div>
          <span className="feature-hero-eyebrow">🛡️ Verified Profiles</span>
          <h1>Match only with verified, real people</h1>
          <p>Identity-checked and photo-validated profiles only — no bots, no fake accounts.</p>
          <button
            type="button"
            className="feature-hero-link"
            onClick={() => onNavigate("feature-verified-profiles")}
          >
            Learn more about Verified Profiles →
          </button>
        </div>
      </header>

      <div className="verified-toolbar">
        <span className="verified-toolbar-count">
          <strong>{visible.length}</strong> verified profile{visible.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          className="feature-secondary-link"
          onClick={() => onNavigate("profile")}
        >
          Verify your own profile →
        </button>
      </div>

      {loading ? (
        <p className="feature-empty">Loading verified profiles…</p>
      ) : !visible.length ? (
        <div className="feature-empty">
          <p>No verified profiles to show right now.</p>
        </div>
      ) : (
        <>
          {featured && (
            <article className="verified-featured">
              <div className="verified-featured-photo">
                <img src={featured.photos[0]} alt={featured.name} />
                <span className="verified-featured-badge">✓ Verified</span>
                {featured.online && <span className="verified-featured-online">● Online now</span>}
              </div>
              <div className="verified-featured-body">
                <span className="verified-featured-eyebrow">Spotlight</span>
                <h2>
                  {featured.name}, <span className="verified-featured-age">{featured.age}</span>
                </h2>
                <p className="verified-featured-location">📍 {featured.location}</p>
                {featured.bio && <p className="verified-featured-bio">{featured.bio}</p>}
                {featured.interests?.length ? (
                  <div className="verified-featured-tags">
                    {featured.interests.slice(0, 5).map((i) => (
                      <span key={i} className="verified-featured-tag">{i}</span>
                    ))}
                  </div>
                ) : null}
                <div className="verified-featured-actions">
                  <button className="btn-like" onClick={() => handleLike(featured.id)}>
                    ♥ Like
                  </button>
                  <button className="btn-message" onClick={() => onNavigate("chat")}>
                    💬 Message
                  </button>
                </div>
              </div>
            </article>
          )}

          {onlineNow.length > 0 && (
            <section className="verified-rail">
              <header className="verified-rail-head">
                <h3>Online now</h3>
                <span className="verified-rail-meta">{onlineNow.length} verified people active</span>
              </header>
              <div className="verified-rail-list">
                {onlineNow.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="verified-rail-card"
                    onClick={() => handleLike(u.id)}
                    title={`Like ${u.name}`}
                  >
                    <div className="verified-rail-photo">
                      <img src={u.photos[0]} alt={u.name} />
                      <span className="verified-rail-online" />
                    </div>
                    <span className="verified-rail-name">
                      {u.name}, {u.age}
                    </span>
                    <span className="verified-rail-loc">{u.location}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <header className="verified-section-head">
                <h3>All verified</h3>
              </header>
              <div className="verified-grid">
                {rest.map((u) => (
                  <article key={u.id} className="verified-card">
                    <div className="verified-photo-wrap">
                      {u.photos?.[0] && <img src={u.photos[0]} alt={u.name} />}
                      <span className="verified-card-badge">✓ Verified</span>
                      <div className={`verified-online ${u.online ? "is-online" : ""}`} />
                    </div>
                    <div className="verified-body">
                      <h3>
                        {u.name}, {u.age}
                      </h3>
                      <p className="verified-location">{u.location}</p>
                      {u.bio && <p className="verified-bio">{u.bio.substring(0, 100)}…</p>}
                      <div className="verified-actions">
                        <button className="btn-like" onClick={() => handleLike(u.id)}>
                          ♥ Like
                        </button>
                        <button className="btn-message" onClick={() => onNavigate("chat")}>
                          💬 Message
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
