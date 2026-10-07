import { useEffect, useState } from "react";
import { SignUpPage, SignUpData } from "./SignUpPage";
import { defaultQuickNavLinks, QuickNav } from "./QuickNav";
import { PhoneNumberInput } from "./PhoneNumberInput";
import { normalizePhoneNumber } from "../utils/phone";
import "../styles/LoginPage.css";

const wantsSignUpFromUrl = () => {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  if (window.location.pathname === "/signup=1") return true;
  if (/[?&]signup=1\b/.test(search)) return true;
  if (hash === "#signup" || hash === "#/signup") return true;
  return false;
};

interface LoginPageProps {
  onLogin: (phone: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  onSignUp?: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  onRequestPasswordReset: (phone: string) => Promise<{ success: boolean; error?: string; developmentCode?: string }>;
  onResetPassword: (phone: string, code: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onViewFeature?: (page: string) => void;
  isLoading: boolean;
  rememberedPhone?: string;
  messagingOnly?: boolean;
}

const APP_STORE_URL = "https://apps.apple.com";
const GOOGLE_PLAY_URL = "https://play.google.com/store/search?q=lets%20date&c=apps";
const loginQuickNavLinks = defaultQuickNavLinks.map((link) => ({
  ...link,
  page: {
    discover: "about-discover",
    matches: "about-matches",
    likes: "about-likes",
    chat: "about-messages",
    profile: "about-profile",
    settings: "about-settings",
    "smart-discovery": "feature-smart-discovery",
    "verified-profiles": "feature-verified-profiles",
    "better-matches": "feature-better-matches",
  }[link.page] || link.page,
}));

export function LoginPage({
  onLogin,
  onSignUp,
  onRequestPasswordReset,
  onResetPassword,
  onViewFeature,
  isLoading,
  rememberedPhone = "",
  messagingOnly = false,
}: LoginPageProps) {
  const initialPhone = rememberedPhone.includes("@") ? "" : rememberedPhone;
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(Boolean(initialPhone));
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(() => wantsSignUpFromUrl());
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [loginNotice, setLoginNotice] = useState("");

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
    setLoginNotice("");

    if (!phone.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      setError("Enter a valid phone number. Start with + and the country code if needed.");
      return;
    }

    const result = await onLogin(normalizedPhone, password, rememberMe);
    if (!result.success) {
      setError(result.error || "Authentication failed");
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      setError("Enter a valid phone number before requesting a reset.");
      return;
    }

    setResetBusy(true);
    try {
      const result = await onRequestPasswordReset(normalizedPhone);
      if (!result.success) {
        setError(result.error || "Unable to request a password reset");
        return;
      }
      setResetRequested(true);
      setDevelopmentCode(result.developmentCode || "");
      setResetMessage("If an account exists for that number, a verification code has been created.");
    } finally {
      setResetBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    if (resetCode.trim().length !== 6) {
      setError("Enter the 6-digit verification code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setResetBusy(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone) {
        setError("Enter a valid phone number before resetting your password.");
        return;
      }
      const result = await onResetPassword(normalizedPhone, resetCode.trim(), newPassword);
      if (!result.success) {
        setError(result.error || "Unable to reset password");
        return;
      }
      setIsForgotPassword(false);
      setPassword("");
      setLoginNotice("Password updated. Sign in with your new password.");
      setResetRequested(false);
      setResetCode("");
      setNewPassword("");
    } finally {
      setResetBusy(false);
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

  if (isForgotPassword) {
    return (
      <div className={`login-page forgot-password-page${messagingOnly ? " messaging-login-page" : ""}`}>
        <div className="login-container">
          <div className="login-header">
            <h1 className="app-title">Reset your password</h1>
            <p className="app-subtitle">Verify your phone number to choose a new password.</p>
          </div>

          {!resetRequested ? (
            <form onSubmit={handleRequestPasswordReset} className="login-form">
              <div className="form-group">
                <label htmlFor="reset-phone">Phone Number</label>
                <PhoneNumberInput
                  id="reset-phone"
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={setPhone}
                  disabled={resetBusy}
                  required
                />
              </div>
              {error && <div className="error-message" role="alert">{error}</div>}
              <button type="submit" className="login-btn" disabled={resetBusy}>
                {resetBusy ? "Sending..." : "Send verification code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="login-form">
              <p className="reset-phone-note">Code requested for <strong>{phone}</strong>.</p>
              {resetMessage && <div className="success-message" role="status">{resetMessage}</div>}
              {developmentCode && (
                <div className="development-code" role="status">
                  Development OTP (SMS is not configured): <strong>{developmentCode}</strong>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="reset-code">6-digit verification code</label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter the code"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={resetBusy}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={resetBusy}
                  required
                />
              </div>
              {error && <div className="error-message" role="alert">{error}</div>}
              <button type="submit" className="login-btn" disabled={resetBusy}>
                {resetBusy ? "Updating..." : "Update password"}
              </button>
              <button
                type="button"
                className="link-btn reset-resend"
                onClick={() => {
                  setResetRequested(false);
                  setResetCode("");
                  setDevelopmentCode("");
                  setError("");
                }}
                disabled={resetBusy}
              >
                Request a new code
              </button>
            </form>
          )}

          <div className="login-footer">
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setIsForgotPassword(false);
                setResetRequested(false);
                setError("");
              }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`login-page${messagingOnly ? " messaging-login-page" : ""}`}>
      <div className="login-container">
        <div className="login-header">
          <h1 className="app-title">
            {messagingOnly ? (
              "Connect"
            ) : (
              <a className="app-home-link" href="/" aria-label="Connect home">💬 Connect</a>
            )}
          </h1>
          <p className="app-subtitle">
            {messagingOnly ? "Real connection starts with a hello." : "Find your perfect match"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <PhoneNumberInput
              id="phone"
              name="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={setPhone}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me on this device
          </label>
          <p className="credential-manager-note">
            We’ll remember your number here. Let your browser save your password too—less typing, more catching up.
          </p>

          <button
            type="button"
            className="link-btn forgot-password-link"
            onClick={() => {
              setIsForgotPassword(true);
              setError("");
              setLoginNotice("");
            }}
          >
            Forgot password?
          </button>
          {loginNotice && <div className="success-message" role="status">{loginNotice}</div>}
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
          {!messagingOnly && (
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
          )}
        </div>

        {!messagingOnly && (
          <QuickNav
            title="Once signed in, you'll have access to:"
            description="Select a section to learn what you can do there."
            onNavigate={(page) => onViewFeature?.(page)}
            links={loginQuickNavLinks}
          />
        )}
      </div>

      {!messagingOnly && <div className="login-features">
        <h2>Why Choose Connect?</h2>
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
      </div>}
    </div>
  );
}
