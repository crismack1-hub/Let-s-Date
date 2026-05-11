import { useEffect, useState } from "react";
import { SignUpPage, SignUpData } from "./SignUpPage";
import { QuickNav } from "./QuickNav";
import "../styles/LoginPage.css";

const wantsSignUpFromUrl = () => {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  if (/[?&]signup=1\b/.test(search)) return true;
  if (hash === "#signup" || hash === "#/signup") return true;
  return false;
};

interface LoginPageProps {
  onLogin: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignUp?: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  onViewFeature?: (page: string) => void;
  isLoading: boolean;
}

const APP_STORE_URL = "https://apps.apple.com";
const GOOGLE_PLAY_URL = "https://play.google.com/store/search?q=lets%20date&c=apps";

export function LoginPage({ onLogin, onSignUp, onViewFeature, isLoading }: LoginPageProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(() => wantsSignUpFromUrl());

  useEffect(() => {
    const onHash = () => {
      if (wantsSignUpFromUrl()) setIsSignUp(true);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await onLogin(phone, password);
    if (!result.success) {
      setError(result.error || "Authentication failed");
    }
  };

  if (isSignUp) {
    return (
      <SignUpPage
        onSignUp={
          onSignUp ||
          (async () => ({
            success: false,
            error: "Sign up not implemented",
          }))
        }
        onBackToLogin={() => setIsSignUp(false)}
        onViewFeature={onViewFeature}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="app-title">💕 Let's Date</h1>
          <p className="app-subtitle">Find your perfect match</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              Sign up here
            </button>
          </p>
          <div className="mobile-link">
            <span>Download the app</span>
            <div className="store-links">
              <a href={GOOGLE_PLAY_URL} className="store-link" target="_blank" rel="noopener noreferrer">
                Google Play
              </a>
              <a href={APP_STORE_URL} className="store-link" target="_blank" rel="noopener noreferrer">
                App Store
              </a>
            </div>
          </div>
        </div>

        <QuickNav
          title="Once signed in, you'll have access to:"
          description="Click any section — you'll be brought back here to sign in first."
          onNavigate={(page) => onViewFeature?.(page)}
        />
      </div>

      <div className="login-features">
        <h2>Why Choose Let's Date?</h2>
        <div className="features-list">
          <div className="feature">
            <span className="icon">🔍</span>
            <h3>Smart Discovery</h3>
            <p>Find compatible matches with advanced filters</p>
            <button
              type="button"
              className="feature-link"
              onClick={() => onViewFeature?.("feature-smart-discovery")}
            >
              Learn more →
            </button>
          </div>
          <div className="feature">
            <span className="icon">🛡️</span>
            <h3>Verified Profiles</h3>
            <p>Match with verified and authentic people</p>
            <button
              type="button"
              className="feature-link"
              onClick={() => onViewFeature?.("feature-verified-profiles")}
            >
              Learn more →
            </button>
          </div>
          <div className="feature">
            <span className="icon">💬</span>
            <h3>Real Conversations</h3>
            <p>Connect instantly with real-time messaging</p>
            <button
              type="button"
              className="feature-link"
              onClick={() => onViewFeature?.("real-conversations")}
            >
              Open chats →
            </button>
          </div>
          <div className="feature">
            <span className="icon">💞</span>
            <h3>Better Matches</h3>
            <p>Real people, real chemistry — built on shared interests</p>
            <button
              type="button"
              className="feature-link"
              onClick={() => onViewFeature?.("feature-better-matches")}
            >
              Learn more →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
