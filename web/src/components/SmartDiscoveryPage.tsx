import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { DiscoverCard } from "./DiscoverCard";
import "../styles/DiscoverPage.css";
import "../styles/FeaturePages.css";
import "../styles/AdvancedFiltering.css";

interface SmartDiscoveryPageProps {
  token: string;
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

export function SmartDiscoveryPage({ token }: SmartDiscoveryPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 40,
    distance: 50,
    location: "",
    lookingFor: "any",
    education: "any",
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [filters.ageMin, filters.ageMax, token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ageMin: filters.ageMin.toString(),
        ageMax: filters.ageMax.toString(),
        distance: filters.distance.toString(),
      });
      if (filters.location) params.append("location", filters.location);
      const res = await fetch(`http://localhost:4000/api/discover?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("smart-discovery fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleLike = async (userId: string) => {
    try {
      await fetch(`http://localhost:4000/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: userId }),
      });
      goNext();
    } catch (e) {
      console.error(e);
    }
  };

  const goNext = () => setCurrentIndex((i) => (users.length ? (i + 1) % users.length : 0));

  const filteredUsers = users.filter((u) => {
    if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
    if (filters.location && !u.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.lookingFor !== "any" && u.lookingFor !== filters.lookingFor) return false;
    if (filters.education !== "any" && u.education !== filters.education) return false;
    if (selectedInterests.length && !u.interests?.some((ui) => selectedInterests.includes(ui))) return false;
    return true;
  });

  const safeIndex = filteredUsers.length ? currentIndex % filteredUsers.length : 0;
  const currentUser = filteredUsers[safeIndex];

  return (
    <div className="feature-functional-page">
      <header className="feature-functional-hero feature-hero-discovery">
        <div>
          <span className="feature-hero-eyebrow">🔍 Smart Discovery</span>
          <h1>Find your most compatible matches</h1>
          <p>Filter by age, distance, interests, and shared values — built around real people, no AI.</p>
        </div>
      </header>

      <div className="feature-controls">
        <div className="feature-control-row">
          <label>
            Age
            <span className="feature-range-values">
              {filters.ageMin}–{filters.ageMax}
            </span>
          </label>
          <div className="feature-range-pair">
            <input
              type="number"
              min={18}
              max={100}
              value={filters.ageMin}
              onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) || 18 })}
            />
            <input
              type="number"
              min={18}
              max={100}
              value={filters.ageMax}
              onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) || 40 })}
            />
          </div>
        </div>

        <div className="feature-control-row">
          <label>Distance</label>
          <input
            type="range"
            min={1}
            max={500}
            value={filters.distance}
            onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
          />
          <span className="feature-range-values">{filters.distance} km</span>
        </div>

        <div className="feature-control-row">
          <label>Location</label>
          <input
            type="text"
            placeholder="City or area"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
        </div>

        <div className="feature-control-row">
          <label>Looking for</label>
          <select
            value={filters.lookingFor}
            onChange={(e) => setFilters({ ...filters, lookingFor: e.target.value })}
          >
            <option value="any">Any</option>
            <option value="Long-term">Long-term</option>
            <option value="Open to anything">Open to anything</option>
          </select>
        </div>

        <div className="feature-control-row">
          <label>Education</label>
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

        <div className="feature-interest-chips">
          <span className="feature-interest-label">Interests:</span>
          {interestChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`feature-chip ${selectedInterests.includes(chip) ? "active" : ""}`}
              onClick={() => toggleInterest(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="advanced-filter-results-header">
        <h2>
          <strong>{filteredUsers.length}</strong> profile{filteredUsers.length === 1 ? "" : "s"} match
        </h2>
        {filteredUsers.length !== users.length && (
          <span className="advanced-filter-results-meta">(filtered from {users.length} total)</span>
        )}
      </div>

      <div className="feature-content-area">
        {loading ? (
          <p>Loading profiles…</p>
        ) : !filteredUsers.length ? (
          <div className="feature-empty">
            <p>No profiles match your filters yet. Try widening the search.</p>
          </div>
        ) : (
          <DiscoverCard
            user={currentUser}
            onLike={() => handleLike(currentUser.id)}
            onPass={goNext}
            onViewProfile={() => console.log("view", currentUser.id)}
          />
        )}
      </div>
    </div>
  );
}
