import { useEffect, useMemo, useState } from "react";
import { UserProfile } from "../types";
import "../styles/FeaturePages.css";
import "../styles/AdvancedFiltering.css";

interface AdvancedFilteringPageProps {
  token: string;
  onNavigate: (page: string) => void;
}

type Choice = "any" | "yes" | "no";

interface Filters {
  ageMin: number;
  ageMax: number;
  location: string;
  smoking: Choice;
  drinking: Choice;
  bodyType: string;
  lookingFor: string;
  education: string;
  gender: string;
  interests: string[];
}

const interestChips = [
  "Hiking",
  "Coffee",
  "Travel",
  "Music",
  "Movies",
  "Books",
  "Foodie",
  "Fitness",
  "Art",
  "Pets",
];

const initialFilters: Filters = {
  ageMin: 18,
  ageMax: 60,
  location: "",
  smoking: "any",
  drinking: "any",
  bodyType: "any",
  lookingFor: "any",
  education: "any",
  gender: "any",
  interests: [],
};

const filterTopics = [
  {
    id: "lifestyle",
    icon: "🌿",
    title: "Lifestyle",
    text: "Filter by smoking, drinking, body type, and daily habits to find people who fit how you actually live.",
  },
  {
    id: "interests",
    icon: "🎯",
    title: "Interests",
    text: "Pick the hobbies and interests that matter to you. Profiles with matching interests rise to the top.",
  },
  {
    id: "location",
    icon: "📍",
    title: "Location",
    text: "Search by city or area to focus on people who are actually nearby.",
  },
  {
    id: "shared-values",
    icon: "🤝",
    title: "Shared values",
    text: "What you're looking for, education, and values — narrow to people who match the kind of relationship you want.",
  },
];

export function AdvancedFilteringPage({ token, onNavigate }: AdvancedFilteringPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:4000/api/discover", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.error("advanced-filtering fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
      if (filters.location && !u.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.gender !== "any" && u.gender !== filters.gender) return false;
      if (filters.smoking === "yes" && !u.smoking) return false;
      if (filters.smoking === "no" && u.smoking) return false;
      if (filters.drinking === "yes" && !u.drinking) return false;
      if (filters.drinking === "no" && u.drinking) return false;
      if (filters.bodyType !== "any" && u.bodyType !== filters.bodyType) return false;
      if (filters.lookingFor !== "any" && u.lookingFor !== filters.lookingFor) return false;
      if (filters.education !== "any" && u.education !== filters.education) return false;
      if (filters.interests.length) {
        if (!u.interests?.some((i) => filters.interests.includes(i))) return false;
      }
      return true;
    });
  }, [users, filters]);

  const toggleInterest = (interest: string) => {
    setFilters((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((x) => x !== interest)
        : [...f.interests, interest],
    }));
  };

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

  const reset = () => setFilters(initialFilters);

  return (
    <div className="feature-functional-page">
      <header className="feature-functional-hero feature-hero-discovery">
        <div>
          <span className="feature-hero-eyebrow">⚙️ Advanced Filtering</span>
          <h1>Filter by lifestyle, interests, location & shared values</h1>
          <p>Surface the profiles that actually fit how you live and what you're looking for.</p>
        </div>
      </header>

      <div className="filter-topic-grid">
        {filterTopics.map((t) => (
          <button
            key={t.id}
            type="button"
            className="filter-topic-card"
            onClick={() => onNavigate(`filter-${t.id}`)}
          >
            <span className="filter-topic-icon">{t.icon}</span>
            <div className="filter-topic-body">
              <h3>{t.title}</h3>
              <p>{t.text}</p>
              <span className="filter-topic-link">Learn more →</span>
            </div>
          </button>
        ))}
      </div>

      <section className="advanced-filter-panel">
        <header className="advanced-filter-panel-header">
          <h2>Refine your search</h2>
          <button type="button" className="filter-reset" onClick={reset}>
            Reset all
          </button>
        </header>

        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-group-title">📍 Location</label>
            <input
              type="text"
              placeholder="City or area"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label className="filter-group-title">🎂 Age range</label>
            <div className="filter-range-pair">
              <input
                type="number"
                min={18}
                max={100}
                value={filters.ageMin}
                onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) || 18 })}
              />
              <span>to</span>
              <input
                type="number"
                min={18}
                max={100}
                value={filters.ageMax}
                onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">🚻 Gender</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">🚬 Smoking</label>
            <div className="filter-radio-row">
              {(["any", "no", "yes"] as Choice[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`filter-radio ${filters.smoking === v ? "active" : ""}`}
                  onClick={() => setFilters({ ...filters, smoking: v })}
                >
                  {v === "any" ? "Any" : v === "no" ? "Non-smoker" : "Smoker"}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">🍷 Drinking</label>
            <div className="filter-radio-row">
              {(["any", "no", "yes"] as Choice[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`filter-radio ${filters.drinking === v ? "active" : ""}`}
                  onClick={() => setFilters({ ...filters, drinking: v })}
                >
                  {v === "any" ? "Any" : v === "no" ? "Doesn't drink" : "Drinks"}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">💪 Body type</label>
            <select
              value={filters.bodyType}
              onChange={(e) => setFilters({ ...filters, bodyType: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="Slim">Slim</option>
              <option value="Average">Average</option>
              <option value="Athletic">Athletic</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">💞 Looking for</label>
            <select
              value={filters.lookingFor}
              onChange={(e) => setFilters({ ...filters, lookingFor: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="Long-term">Long-term</option>
              <option value="Open to anything">Open to anything</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-group-title">🎓 Education</label>
            <select
              value={filters.education}
              onChange={(e) => setFilters({ ...filters, education: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="Doctorate">Doctorate</option>
              <option value="Trade school">Trade school</option>
              <option value="Culinary school">Culinary school</option>
            </select>
          </div>

          <div className="filter-group filter-group-wide">
            <label className="filter-group-title">🎯 Interests (match any)</label>
            <div className="filter-chip-row">
              {interestChips.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`feature-chip ${filters.interests.includes(c) ? "active" : ""}`}
                  onClick={() => toggleInterest(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="advanced-filter-results-header">
        <h2>
          <strong>{filtered.length}</strong> profile{filtered.length === 1 ? "" : "s"} match
        </h2>
        {filtered.length !== users.length && (
          <span className="advanced-filter-results-meta">
            (filtered from {users.length} total)
          </span>
        )}
      </div>

      <div className="feature-content-area">
        {loading ? (
          <p>Loading profiles…</p>
        ) : !filtered.length ? (
          <div className="feature-empty">
            <p>No profiles match these filters. Try widening your criteria.</p>
            <button type="button" className="feature-primary-btn" onClick={reset}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="verified-grid">
            {filtered.map((u) => {
              const liked = likedIds.includes(u.id);
              return (
                <article key={u.id} className="verified-card">
                  <div className="verified-photo-wrap">
                    {u.photos?.[0] && <img src={u.photos[0]} alt={u.name} />}
                    {u.verified && <span className="verified-card-badge">✓ Verified</span>}
                    <div className={`verified-online ${u.online ? "is-online" : ""}`} />
                  </div>
                  <div className="verified-body">
                    <h3>
                      {u.name}, {u.age}
                    </h3>
                    <p className="verified-location">{u.location}</p>
                    {u.bio && <p className="verified-bio">{u.bio.substring(0, 100)}…</p>}
                    <div className="verified-actions">
                      <button
                        className="btn-like"
                        onClick={() => handleLike(u.id)}
                        disabled={liked}
                      >
                        {liked ? "♥ Liked" : "♥ Like"}
                      </button>
                      <button className="btn-message" onClick={() => onNavigate("chat")}>
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
