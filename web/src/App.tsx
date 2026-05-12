import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useSocket } from "./hooks/useSocket";
import { UserProfile } from "./types";
import { LoginPage } from "./components/LoginPage";
import type { SignUpData } from "./components/SignUpPage";
import { Navbar } from "./components/Navbar";
import { DiscoverPage } from "./components/DiscoverPage";
import { MatchesPage } from "./components/MatchesPage";
import { LikesPage } from "./components/LikesPage";
import { ChatPage } from "./components/ChatPage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { FeaturePage } from "./components/FeaturePage";
import { FeatureOverviewPage } from "./components/FeatureOverviewPage";
import { SmartDiscoveryPage } from "./components/SmartDiscoveryPage";
import { VerifiedProfilesPage } from "./components/VerifiedProfilesPage";
import { RealConversationsPage } from "./components/RealConversationsPage";
import { BetterMatchesPage } from "./components/BetterMatchesPage";
import { SubscribePage } from "./components/SubscribePage";
import { TrustTopicPage, type TrustTopicId } from "./components/TrustTopicPage";
import { AdvancedFilteringPage } from "./components/AdvancedFilteringPage";
import { FilterTopicPage, type FilterTopicId } from "./components/FilterTopicPage";
import { BrowsePage } from "./components/BrowsePage";
import { PageInfoPage, type PageInfoId } from "./components/PageInfoPage";
import "./App.css";

function App() {
  const { user, token, loading, login, logout, signUp } = useAuth();
  const { socket, connected } = useSocket(token);
  const authToken = token ?? "";
  const [currentPage, setCurrentPage] = useState("discover");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);
  const [chatTarget, setChatTarget] = useState<string | null>(null);

  const openChatWith = (userId: string) => {
    setChatTarget(userId);
    setCurrentPage("chat");
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchUnreadCounts();
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const target = params.get("chat");
    if (target) {
      setChatTarget(target);
      setCurrentPage("chat");
      params.delete("chat");
      const search = params.toString();
      const next = window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
      window.history.replaceState({}, "", next);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("new-like", () => {
        setUnreadLikes((prev) => prev + 1);
      });

      socket.on("new-message", () => {
        setUnreadCount((prev) => prev + 1);
      });

      socket.on("match", () => {
        // Show match notification
        console.log("New match!");
      });

      return () => {
        socket.off("new-like");
        socket.off("new-message");
        socket.off("match");
      };
    }
  }, [socket]);

  const fetchUserProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://localhost:4000/api/unread-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.messages || 0);
        setUnreadLikes(data.likes || 0);
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const handleLogin = async (phone: string, password: string) => {
    return await login(phone, password);
  };

  const handleSignUp = async (data: SignUpData) => {
    return await signUp(data);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("discover");
    setUserProfile(null);
  };

  const handleViewFeature = (page: string) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (
    !token &&
    !currentPage.startsWith("feature") &&
    !currentPage.startsWith("trust-") &&
    !currentPage.startsWith("filter-") &&
    !currentPage.startsWith("about-") &&
    currentPage !== "advanced-filtering" &&
    currentPage !== "browse" &&
    currentPage !== "subscribe"
  ) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onViewFeature={handleViewFeature}
        isLoading={false}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "discover":
        return <DiscoverPage token={authToken} />;
      case "matches":
        return <MatchesPage token={authToken} onMessage={openChatWith} />;
      case "likes":
        return <LikesPage token={authToken} />;
      case "chat":
        return (
          <ChatPage
            token={authToken}
            socket={socket}
            currentUserId={userProfile?.id}
            onNavigate={setCurrentPage}
            chatTarget={chatTarget}
            onChatTargetConsumed={() => setChatTarget(null)}
          />
        );
      case "profile":
        return (
          <ProfilePage
            token={authToken}
            user={userProfile}
            onProfileUpdated={setUserProfile}
          />
        );
      case "settings":
        return (
          <SettingsPage
            token={authToken}
            userProfile={userProfile}
            onNavigate={setCurrentPage}
            onSaveSettings={async () => ({ success: true })}
          />
        );
      case "features":
        return <FeatureOverviewPage onViewFeature={handleViewFeature} />;
      case "smart-discovery":
        return <SmartDiscoveryPage token={authToken} />;
      case "verified-profiles":
        return <VerifiedProfilesPage token={authToken} onNavigate={setCurrentPage} />;
      case "real-conversations":
        return <RealConversationsPage token={authToken} onNavigate={setCurrentPage} />;
      case "better-matches":
        return <BetterMatchesPage token={authToken} onNavigate={setCurrentPage} />;
      case "subscribe":
        return <SubscribePage onNavigate={setCurrentPage} />;
      case "trust-trusted-members":
      case "trust-verified-badge":
      case "trust-real-people-only":
        return (
          <TrustTopicPage
            topic={currentPage.replace("trust-", "") as TrustTopicId}
            onNavigate={setCurrentPage}
            onBack={() => setCurrentPage("feature-verified-profiles")}
            token={authToken}
          />
        );
      case "advanced-filtering":
        return <AdvancedFilteringPage token={authToken} onNavigate={setCurrentPage} />;
      case "browse":
        return <BrowsePage onNavigate={setCurrentPage} />;
      case "about-discover":
      case "about-matches":
      case "about-likes":
      case "about-messages":
      case "about-profile":
      case "about-settings":
        return (
          <PageInfoPage
            topic={currentPage.replace("about-", "") as PageInfoId}
            onNavigate={setCurrentPage}
            onBack={() => setCurrentPage("browse")}
            token={authToken}
          />
        );
      case "filter-lifestyle":
      case "filter-interests":
      case "filter-location":
      case "filter-shared-values":
        return (
          <FilterTopicPage
            topic={currentPage.replace("filter-", "") as FilterTopicId}
            onNavigate={setCurrentPage}
            onBack={() => setCurrentPage("advanced-filtering")}
            token={authToken}
          />
        );
      case "feature-smart-discovery":
      case "feature-verified-profiles":
      case "feature-real-conversations":
      case "feature-better-matches":
        return (
          <FeaturePage
            feature={currentPage.replace("feature-", "") as
              | "smart-discovery"
              | "verified-profiles"
              | "real-conversations"
              | "better-matches"}
            onBack={() => setCurrentPage("features")}
            onNavigate={setCurrentPage}
            token={authToken}
          />
        );
      default:
        return <DiscoverPage token={authToken} />;
    }
  };

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        unreadCount={unreadCount}
        unreadLikes={unreadLikes}
        onLogout={handleLogout}
      />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
