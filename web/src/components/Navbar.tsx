import { useEffect, useRef } from "react";
import "../styles/Navbar.css";

import { useSubscription, TESTING_ACCESS } from "../hooks/useSubscription";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadCount: number;
  unreadLikes: number;
  onLogout: () => void;
}

export function Navbar({
  currentPage,
  onNavigate,
  unreadCount,
  unreadLikes,
  onLogout,
}: NavbarProps) {
  const { isPremium } = useSubscription();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLElement>(".nav-link.active")
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [currentPage]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button
          type="button"
          className="logo logo-link"
          onClick={() => onNavigate("discover")}
          aria-label="Connect — go to home"
        >
          💬 Connect
        </button>
      </div>

      <div className="navbar-menu" ref={menuRef} aria-label="Main navigation">
        <button
          className={`nav-link ${currentPage === "browse" ? "active" : ""}`}
          onClick={() => onNavigate("browse")}
        >
          📑 Browse
        </button>

        <button
          className={`nav-link ${currentPage === "discover" ? "active" : ""}`}
          onClick={() => onNavigate("discover")}
        >
          🔍 Discover
        </button>

        <button
          className={`nav-link ${currentPage === "matches" ? "active" : ""}`}
          onClick={() => onNavigate("matches")}
        >
          ♥ Matches
        </button>

        <button
          className={`nav-link ${currentPage === "friends" ? "active" : ""}`}
          onClick={() => onNavigate("friends")}
        >
          👥 Friends
        </button>

        <button
          className={`nav-link ${currentPage === "smart-discovery" ? "active" : ""}`}
          onClick={() => onNavigate("smart-discovery")}
        >
          🔍 Smart Discovery
        </button>

        <button
          className={`nav-link ${currentPage === "verified-profiles" ? "active" : ""}`}
          onClick={() => onNavigate("verified-profiles")}
        >
          🛡️ Verified
        </button>

        <button
          className={`nav-link ${currentPage === "features" ? "active" : ""}`}
          onClick={() => onNavigate("features")}
        >
          ✨ Features
        </button>

        <button
          className={`nav-link ${currentPage === "likes" ? "active" : ""}`}
          onClick={() => onNavigate("likes")}
        >
          💕 Likes
          {unreadLikes > 0 && <span className="badge">{unreadLikes}</span>}
        </button>

        <button
          className={`nav-link ${currentPage === "chat" ? "active" : ""}`}
          onClick={() => onNavigate("chat")}
        >
          💬 Messages
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>

        <button
          className={`nav-link ${currentPage === "profile" ? "active" : ""}`}
          onClick={() => onNavigate("profile")}
        >
          👤 Profile
        </button>

        <button
          className={`nav-link ${currentPage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="navbar-right">
        {TESTING_ACCESS ? (
          <button
            className="plan-pill plan-pill-premium"
            onClick={() => onNavigate("subscribe")}
            title="All features are free during testing"
          >
            Free testing
          </button>
        ) : isPremium ? (
          <button
            className={`plan-pill plan-pill-premium ${currentPage === "subscribe" ? "active" : ""}`}
            onClick={() => onNavigate("subscribe")}
            title="Manage subscription"
          >
            ★ Premium
          </button>
        ) : (
          <button
            className={`plan-pill plan-pill-upgrade ${currentPage === "subscribe" ? "active" : ""}`}
            onClick={() => onNavigate("subscribe")}
          >
            Upgrade
          </button>
        )}
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
