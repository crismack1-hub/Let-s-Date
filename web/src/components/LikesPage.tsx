import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import "../styles/LikesPage.css";

interface LikesPageProps {
  token: string;
}

export function LikesPage({ token }: LikesPageProps) {
  const [likes, setLikes] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikes();
  }, [token]);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/api/likes", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (userId: string) => {
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
        setLikes(likes.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Error liking back:", error);
    }
  };

  const handlePass = async (userId: string) => {
    setLikes(likes.filter((u) => u.id !== userId));
  };

  if (loading) {
    return <div className="likes-page"><p>Loading...</p></div>;
  }

  return (
    <div className="likes-page">
      <div className="likes-header">
        <h1>Who Likes You 💕</h1>
        <p className="subtitle">{likes.length} people have liked you</p>
      </div>

      {likes.length === 0 ? (
        <div className="empty-state">
          <p>Keep discovering! More likes coming soon. 🌟</p>
        </div>
      ) : (
        <div className="likes-grid">
          {likes.map((user) => (
            <div key={user.id} className="like-card">
              <div className="like-image-container">
                <img src={user.photos[0]} alt={user.name} className="like-image" />
              </div>

              <div className="like-info">
                <h3>
                  {user.name}, {user.age}
                </h3>
                <p className="location">📍 {user.location}</p>
                <p className="bio">{user.bio.substring(0, 80)}...</p>

                <div className="like-tags">
                  {user.interests.slice(0, 3).map((interest) => (
                    <span key={interest} className="tag">
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="like-actions">
                  <button
                    className="btn-like-back"
                    onClick={() => handleLikeBack(user.id)}
                  >
                    ♥ Like Back
                  </button>
                  <button className="btn-pass" onClick={() => handlePass(user.id)}>
                    ✕ Pass
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
