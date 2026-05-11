import { useEffect, useState } from "react";
import { Conversation } from "../types";
import { useSubscription, FREE_DAILY_MESSAGE_LIMIT } from "../hooks/useSubscription";
import "../styles/FeaturePages.css";

interface RealConversationsPageProps {
  token: string;
  onNavigate: (page: string) => void;
}

export function RealConversationsPage({ token, onNavigate }: RealConversationsPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPremium, messagesUsedToday, messagesLeftToday } = useSubscription();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:4000/api/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setConversations(await res.json());
      } catch (e) {
        console.error("conversations fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const onlineCount = conversations.filter((c) => c.online).length;

  return (
    <div className="feature-functional-page">
      <header className="feature-functional-hero feature-hero-conversations">
        <div>
          <span className="feature-hero-eyebrow">💬 Real Conversations</span>
          <h1>Chat with real people in real time</h1>
          <p>Every message is human — no chatbots, no auto-replies, no smart-reply suggestions.</p>
        </div>
      </header>

      <div className="conversations-launcher">
        <div className="conversations-launcher-text">
          <h2>Open the messaging app</h2>
          <p>
            {loading
              ? "Loading your conversations…"
              : conversations.length
              ? `You have ${conversations.length} active conversation${conversations.length === 1 ? "" : "s"}${
                  totalUnread ? ` and ${totalUnread} unread message${totalUnread === 1 ? "" : "s"}` : ""
                }.`
              : "Start your first conversation by liking someone in Discover."}
          </p>
          {!isPremium && (
            <p className="conversations-launcher-plan">
              Free plan: {messagesUsedToday}/{FREE_DAILY_MESSAGE_LIMIT} messages used today —{" "}
              <strong>{messagesLeftToday}</strong> left.{" "}
              <button
                type="button"
                className="feature-secondary-link"
                onClick={() => onNavigate("subscribe")}
              >
                Upgrade for unlimited →
              </button>
            </p>
          )}
        </div>
        <div className="conversations-launcher-actions">
          <button
            type="button"
            className="feature-primary-btn conversations-launcher-primary"
            onClick={() => onNavigate("chat")}
          >
            Open chats
          </button>
          <button
            type="button"
            className="feature-secondary-btn"
            onClick={() => onNavigate("matches")}
          >
            View matches
          </button>
        </div>
      </div>

      <div className="conversations-stats">
        <div className="feature-stat">
          <span className="feature-stat-value">{conversations.length}</span>
          <span className="feature-stat-label">Active conversations</span>
        </div>
        <div className="feature-stat">
          <span className="feature-stat-value">{onlineCount}</span>
          <span className="feature-stat-label">Online now</span>
        </div>
        <div className="feature-stat">
          <span className="feature-stat-value">{totalUnread}</span>
          <span className="feature-stat-label">Unread</span>
        </div>
        <div className={`feature-stat ${isPremium ? "feature-stat-premium" : ""}`}>
          <span className="feature-stat-value">
            {isPremium ? "∞" : `${messagesUsedToday}/${FREE_DAILY_MESSAGE_LIMIT}`}
          </span>
          <span className="feature-stat-label">
            {isPremium ? "Premium · unlimited" : `Messages today · ${messagesLeftToday} left`}
          </span>
        </div>
      </div>

      <div className="conversations-help">
        <p>
          Want to meet someone new first?{" "}
          <button
            type="button"
            className="feature-secondary-link"
            onClick={() => onNavigate("smart-discovery")}
          >
            Open Smart Discovery →
          </button>
        </p>
      </div>
    </div>
  );
}
