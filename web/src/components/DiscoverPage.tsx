import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { DiscoverCard } from "./DiscoverCard";
import "../styles/DiscoverPage.css";

interface DiscoverPageProps {
  token: string;
}

export function DiscoverPage({ token }: DiscoverPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 40,
    location: "",
    distance: 50,
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters, token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ageMin: filters.ageMin.toString(),
        ageMax: filters.ageMax.toString(),
        distance: filters.distance.toString(),
      });
      if (filters.location) {
        queryParams.append("location", filters.location);
      }

      const response = await fetch(`http://localhost:4000/api/discover?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: userId }),
      });

      if (response.ok) {
        goToNextUser();
      }
    } catch (error) {
      console.error("Error liking user:", error);
    }
  };

  const handlePass = () => {
    goToNextUser();
  };

  const goToNextUser = () => {
    setCurrentIndex((prev) => (prev + 1) % users.length);
  };

  if (loading) {
    return <div className="discover-page"><p>Loading profiles...</p></div>;
  }

  if (users.length === 0) {
    return <div className="discover-page"><p>No more profiles to discover</p></div>;
  }

  const currentUser = users[currentIndex];

  return (
    <div className="discover-page">
      <header className="discover-hero">
        <div className="discover-hero-text">
          <span className="discover-eyebrow">Discover</span>
          <h1>Meet someone new</h1>
          <p>One real person at a time. Tap ♥ Like or ✕ Pass to move on.</p>
        </div>
        <div className="discover-hero-side">
          <span className="discover-counter">
            {currentIndex + 1} <span className="discover-counter-sep">/</span> {users.length}
          </span>
          <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
            <span aria-hidden>⚙</span> Filters
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Age Range</label>
            <div className="range-inputs">
              <input
                type="number"
                min="18"
                max="100"
                value={filters.ageMin}
                onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) })}
              />
              <span>-</span>
              <input
                type="number"
                min="18"
                max="100"
                value={filters.ageMax}
                onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Distance (km)</label>
            <input
              type="range"
              min="1"
              max="500"
              value={filters.distance}
              onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
            />
            <span>{filters.distance} km</span>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="City or area"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="discover-content">
        <DiscoverCard
          user={currentUser}
          onLike={() => handleLike(currentUser.id)}
          onPass={handlePass}
          onViewProfile={() => console.log("View profile:", currentUser.id)}
        />
      </div>
    </div>
  );
}
