import { useState } from "react";
import { UserProfile } from "../types";
import "../styles/DiscoverCard.css";

interface DiscoverCardProps {
  user: UserProfile;
  onLike: () => void;
  onPass: () => void;
  onViewProfile: () => void;
}

export function DiscoverCard({ user, onLike, onPass, onViewProfile }: DiscoverCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const goToPreviousPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === 0 ? user.photos.length - 1 : prev - 1));
  const goToNextPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === user.photos.length - 1 ? 0 : prev + 1));

  return (
    <article className="discover-card">
      <div className="discover-card-photo">
        <img src={user.photos[currentPhotoIndex]} alt={user.name} className="card-image" />

        {user.photos.length > 1 && (
          <>
            <button className="photo-nav prev" onClick={goToPreviousPhoto} aria-label="Previous photo">
              ‹
            </button>
            <button className="photo-nav next" onClick={goToNextPhoto} aria-label="Next photo">
              ›
            </button>
            <div className="photo-indicators">
              {user.photos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`indicator ${index === currentPhotoIndex ? "active" : ""}`}
                  onClick={() => setCurrentPhotoIndex(index)}
                  aria-label={`Photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {user.online && <span className="discover-online-pill">● Online now</span>}
      </div>

      <aside className="discover-card-info">
        <header className="discover-card-head">
          <h2>
            {user.name}, <span className="discover-age">{user.age}</span>
            {user.verified && <span className="verified-badge">✓ Verified</span>}
          </h2>
          <p className="discover-location">📍 {user.location}</p>
        </header>

        {user.bio && <p className="discover-bio">{user.bio}</p>}

        <div className="discover-facts">
          {user.height && (
            <div className="discover-fact">
              <span className="discover-fact-label">Height</span>
              <span className="discover-fact-value">{user.height}</span>
            </div>
          )}
          {user.lookingFor && (
            <div className="discover-fact">
              <span className="discover-fact-label">Looking for</span>
              <span className="discover-fact-value">{user.lookingFor}</span>
            </div>
          )}
          {user.education && (
            <div className="discover-fact">
              <span className="discover-fact-label">Education</span>
              <span className="discover-fact-value">{user.education}</span>
            </div>
          )}
          {user.occupation && (
            <div className="discover-fact">
              <span className="discover-fact-label">Occupation</span>
              <span className="discover-fact-value">{user.occupation}</span>
            </div>
          )}
          {user.zodiacSign && (
            <div className="discover-fact">
              <span className="discover-fact-label">Zodiac</span>
              <span className="discover-fact-value">{user.zodiacSign}</span>
            </div>
          )}
        </div>

        {user.interests && user.interests.length > 0 && (
          <div className="discover-interests">
            <span className="discover-interests-label">Interests</span>
            <div className="discover-interests-list">
              {user.interests.map((interest) => (
                <span key={interest} className="discover-interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="discover-card-actions">
          <button className="action-btn pass" onClick={onPass} title="Pass" aria-label="Pass">
            ✕
          </button>
          <button className="action-btn view" onClick={onViewProfile} title="View profile" aria-label="View profile">
            👁
          </button>
          <button className="action-btn like" onClick={onLike} title="Like" aria-label="Like">
            ♥
          </button>
        </div>
      </aside>
    </article>
  );
}
