import { useEffect, useState } from "react";
import type { UserProfile } from "../types";
import { apiUrl } from "../api";
import "../styles/FriendsPage.css";

interface FriendsPageProps {
  token: string;
  onMessage: (userId: string) => void;
}

type FriendView = "friends" | "discover";

const inviteUrl = "https://let-s-date.vercel.app/";
const inviteText = `Join me on Let's Chat: ${inviteUrl}`;

export function FriendsPage({ token, onMessage }: FriendsPageProps) {
  const [view, setView] = useState<FriendView>("friends");
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [discover, setDiscover] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadFriends();
    void loadDiscover();
  }, [token]);

  const loadFriends = async () => {
    try {
      const response = await fetch(apiUrl("/api/friends"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setFriends(await response.json());
    } catch (requestError) {
      console.error("Could not load friends:", requestError);
      setError("Could not load your friends.");
    } finally {
      setLoading(false);
    }
  };

  const loadDiscover = async () => {
    try {
      const response = await fetch(apiUrl("/api/discover?ageMin=18&ageMax=120"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setDiscover(await response.json());
    } catch (requestError) {
      console.error("Could not load profiles:", requestError);
    }
  };

  const addFriend = async (person: UserProfile) => {
    setPendingId(person.id);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/friends/${encodeURIComponent(person.id)}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not add this friend.");
      setFriends((current) => [person, ...current.filter((friend) => friend.id !== person.id)]);
      setNotice(`${person.name} added to your friends.`);
      setView("friends");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not add this friend.");
    } finally {
      setPendingId(null);
    }
  };

  const removeFriend = async (person: UserProfile) => {
    setPendingId(person.id);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/friends/${encodeURIComponent(person.id)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not remove this friend.");
      setFriends((current) => current.filter((friend) => friend.id !== person.id));
      setNotice(`${person.name} removed from your friends.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not remove this friend.");
    } finally {
      setPendingId(null);
    }
  };

  const shareInvite = async () => {
    setError("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Let's Chat", text: inviteText, url: inviteUrl });
      } else {
        await navigator.clipboard.writeText(inviteText);
        setNotice("Invite link copied.");
      }
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") {
        setError("Could not share the invite link.");
      }
    }
  };

  const visiblePeople = view === "friends"
    ? friends
    : discover.filter((person) => !friends.some((friend) => friend.id === person.id));

  return (
    <section className="friends-page">
      <header className="friends-header">
        <div>
          <span className="friends-eyebrow">Your people</span>
          <h1>Friends</h1>
          <p>Keep your connections together and start a chat anytime.</p>
        </div>
        <div className="friends-count" aria-label={`${friends.length} friends`}>
          <strong>{friends.length}</strong>
          <span>friends</span>
        </div>
      </header>

      <section className="friends-invite" aria-labelledby="friends-invite-title">
        <div className="friends-invite-copy">
          <h2 id="friends-invite-title">Invite someone</h2>
          <p>Share Let's Chat by email, text, or your social apps.</p>
        </div>
        <div className="friends-invite-controls">
          <input
            type="email"
            aria-label="Friend's email address"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <a
            className="friends-invite-link"
            href={email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Join me on Let's Chat")}&body=${encodeURIComponent(inviteText)}` : undefined}
            aria-disabled={!email}
            onClick={(event) => { if (!email) event.preventDefault(); }}
          >
            Email invite
          </a>
          <input
            type="tel"
            aria-label="Friend's phone number"
            placeholder="Phone number"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <a
            className="friends-invite-link"
            href={phone ? `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(inviteText)}` : undefined}
            aria-disabled={!phone}
            onClick={(event) => { if (!phone) event.preventDefault(); }}
          >
            Text invite
          </a>
          <button type="button" className="friends-share-button" onClick={shareInvite}>
            Share link
          </button>
        </div>
        {notice && <p className="friends-notice" role="status">{notice}</p>}
        {error && <p className="friends-error" role="alert">{error}</p>}
      </section>

      <div className="friends-tabs" role="tablist" aria-label="Friends views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "friends"}
          className={view === "friends" ? "active" : ""}
          onClick={() => setView("friends")}
        >
          Friends <span>{friends.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "discover"}
          className={view === "discover" ? "active" : ""}
          onClick={() => setView("discover")}
        >
          Find friends
        </button>
      </div>

      {loading ? (
        <p className="friends-empty">Loading friends…</p>
      ) : visiblePeople.length === 0 ? (
        <div className="friends-empty">
          <h2>{view === "friends" ? "Your friends will show up here" : "No more profiles to add"}</h2>
          <p>{view === "friends" ? "Find people to add, or invite someone you know." : "You've added everyone available right now."}</p>
          {view === "friends" && (
            <button type="button" onClick={() => setView("discover")}>Find friends</button>
          )}
        </div>
      ) : (
        <div className="friends-grid">
          {visiblePeople.map((person) => (
            <article className="friend-card" key={person.id}>
              <div className="friend-card-photo">
                {person.photos?.[0] ? (
                  <img src={person.photos[0]} alt={person.name} loading="lazy" />
                ) : (
                  <span>{person.name.slice(0, 1).toUpperCase()}</span>
                )}
                {person.online && <span className="friend-online">Online</span>}
              </div>
              <div className="friend-card-details">
                <h2>{person.name}, {person.age}</h2>
                <p>{person.location}</p>
                {person.bio && <p className="friend-bio">{person.bio}</p>}
                <div className="friend-card-actions">
                  {view === "friends" ? (
                    <>
                      <button type="button" onClick={() => onMessage(person.id)}>Message</button>
                      <button
                        type="button"
                        className="friend-remove-button"
                        onClick={() => void removeFriend(person)}
                        disabled={pendingId === person.id}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void addFriend(person)}
                      disabled={pendingId === person.id}
                    >
                      {pendingId === person.id ? "Adding…" : "Add friend"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}