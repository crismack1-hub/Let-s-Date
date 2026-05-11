import { useEffect, useMemo, useState } from "react";
import { Match } from "../types";
import "../styles/MatchesPage.css";

interface MatchesPageProps {
  token: string;
  onMessage?: (userId: string) => void;
}

export function MatchesPage({ token, onMessage }: MatchesPageProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "recent" | "favorites">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [token, filterType]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:4000/api/matches?type=${filterType}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
        setSelectedId((current) =>
          current && data.some((m: Match) => m.id === current) ? current : data[0]?.id ?? null,
        );
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId: string) => {
    if (!window.confirm("Are you sure you want to unmatch?")) return;
    try {
      await fetch(`http://localhost:4000/api/matches/${matchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
      setSelectedId((current) => (current === matchId ? null : current));
    } catch (error) {
      console.error("Error unmatching:", error);
    }
  };

  const handleToggleFavorite = async (matchId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/matches/${matchId}/favorite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { favorited } = (await res.json()) as { favorited: boolean };
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, favorited } : m)),
      );
    } catch (error) {
      console.error("Error toggling favourite:", error);
    }
  };

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedId) ?? null,
    [matches, selectedId],
  );

  if (loading) {
    return <div className="matches-page"><p>Loading matches…</p></div>;
  }

  return (
    <div className="matches-page">
      <header className="matches-hero">
        <span className="matches-eyebrow">Matches</span>
        <h1>People you've connected with</h1>
        <p>
          Includes everyone you liked and anyone whose interests overlap{" "}
          <strong>50% or more</strong> with yours. Pick someone to see their profile and start
          chatting.
        </p>
      </header>

      <div className="matches-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={filterType === "all"}
          className={`matches-tab ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All <span className="matches-tab-count">{matches.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={filterType === "recent"}
          className={`matches-tab ${filterType === "recent" ? "active" : ""}`}
          onClick={() => setFilterType("recent")}
        >
          Recent
        </button>
        <button
          role="tab"
          aria-selected={filterType === "favorites"}
          className={`matches-tab ${filterType === "favorites" ? "active" : ""}`}
          onClick={() => setFilterType("favorites")}
        >
          Favourites ♥
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <p>No matches yet. Keep discovering! 💬</p>
        </div>
      ) : (
        <div className="matches-shell">
          <aside className="matches-list">
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                className={`match-row ${match.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(match.id)}
              >
                <div className="match-row-avatar">
                  <img src={match.user.photos[0]} alt={match.user.name} />
                  {match.user.online && <span className="match-row-dot" />}
                </div>
                <div className="match-row-text">
                  <div className="match-row-name">
                    {match.user.name}, {match.user.age}
                    {match.user.verified && <span className="match-row-verified">✓</span>}
                  </div>
                  <div className="match-row-meta">
                    {match.user.location}
                    {typeof match.interestOverlap === "number" && match.interestOverlap > 0 && (
                      <span className="match-row-overlap"> · {match.interestOverlap}% shared</span>
                    )}
                  </div>
                </div>
                {match.favorited && <span className="match-row-fav">♥</span>}
              </button>
            ))}
          </aside>

          <section className="matches-detail">
            {selected ? (
              <>
                <div className="matches-detail-photo">
                  <img src={selected.user.photos[0]} alt={selected.user.name} />
                  {selected.user.online && <span className="matches-detail-online">● Online now</span>}
                  {selected.user.verified && <span className="matches-detail-verified">✓ Verified</span>}
                </div>
                <div className="matches-detail-body">
                  <header className="matches-detail-head">
                    <h2>
                      {selected.user.name}, <span className="matches-detail-age">{selected.user.age}</span>
                    </h2>
                    <p className="matches-detail-meta">
                      📍 {selected.user.location} · Matched{" "}
                      {new Date(selected.matchedAt).toLocaleDateString()}
                    </p>
                    {typeof selected.interestOverlap === "number" && selected.interestOverlap > 0 && (
                      <div className="matches-detail-overlap">
                        <span className="matches-detail-overlap-bar">
                          <span
                            className="matches-detail-overlap-fill"
                            style={{ width: `${Math.min(100, selected.interestOverlap)}%` }}
                          />
                        </span>
                        <span className="matches-detail-overlap-text">
                          {selected.interestOverlap}% shared interests
                          {selected.interestOverlap >= 50 && (
                            <span className="matches-detail-overlap-pill">Strong match</span>
                          )}
                        </span>
                      </div>
                    )}
                  </header>

                  {selected.user.bio && <p className="matches-detail-bio">{selected.user.bio}</p>}

                  <div className="matches-detail-facts">
                    {selected.user.height && (
                      <div><span className="fact-k">Height</span><span className="fact-v">{selected.user.height}</span></div>
                    )}
                    {selected.user.lookingFor && (
                      <div><span className="fact-k">Looking for</span><span className="fact-v">{selected.user.lookingFor}</span></div>
                    )}
                    {selected.user.education && (
                      <div><span className="fact-k">Education</span><span className="fact-v">{selected.user.education}</span></div>
                    )}
                    {selected.user.occupation && (
                      <div><span className="fact-k">Occupation</span><span className="fact-v">{selected.user.occupation}</span></div>
                    )}
                  </div>

                  {selected.user.interests?.length ? (
                    <div className="matches-detail-interests">
                      {selected.user.interests.map((i) => (
                        <span key={i} className="matches-detail-interest">{i}</span>
                      ))}
                    </div>
                  ) : null}

                  <div className="matches-detail-actions">
                    <button
                      className="btn-message"
                      onClick={() => onMessage?.(selected.userId)}
                    >
                      💬 Message
                    </button>
                    <button
                      className={`btn-favorite ${selected.favorited ? "favorited" : ""}`}
                      onClick={() => handleToggleFavorite(selected.id)}
                      aria-label={selected.favorited ? "Unfavourite" : "Favourite"}
                      title={selected.favorited ? "Remove from favourites" : "Add to favourites"}
                    >
                      ♥
                    </button>
                    <button
                      className="btn-unmatch"
                      onClick={() => handleUnmatch(selected.id)}
                      aria-label="Unmatch"
                      title="Unmatch"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="matches-detail-empty">
                <span>👈</span>
                <h3>Pick a match to view their profile</h3>
                <p>Choose someone from the list to see the full profile and message them.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
