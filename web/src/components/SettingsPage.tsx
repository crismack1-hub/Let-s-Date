import { useState } from "react";
import { useSubscription, FREE_DAILY_MESSAGE_LIMIT } from "../hooks/useSubscription";
import "../styles/SettingsPage.css";

interface SettingsPageProps {
  userProfile: any;
  onSaveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>;
  token: string;
  onNavigate?: (page: string) => void;
}

const tabs = [
  { id: "account", icon: "👤", label: "Account" },
  { id: "subscription", icon: "★", label: "Subscription" },
  { id: "privacy", icon: "🔒", label: "Privacy" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "blocked", icon: "🚫", label: "Blocked" },
  { id: "help", icon: "❓", label: "Help" },
];

export function SettingsPage({ userProfile, onSaveSettings, onNavigate }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    locationTracking: false,
    privateProfile: false,
    showOnlineStatus: true,
    messageRequests: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { state, isPremium, cancel, messagesUsedToday, messagesLeftToday } = useSubscription();

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await onSaveSettings(settings);
    setIsSaving(false);
    if (result.success) {
      setDirty(false);
    } else {
      alert(result.error || "Failed to save settings");
    }
  };

  const Toggle = ({ label, description, value, onChange }: {
    label: string;
    description: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <div className="settings-row">
      <div className="settings-row-text">
        <h3>{label}</h3>
        <p>{description}</p>
      </div>
      <label className="settings-toggle">
        <input type="checkbox" checked={value} onChange={onChange} />
        <span className="settings-toggle-track">
          <span className="settings-toggle-knob" />
        </span>
      </label>
    </div>
  );

  return (
    <div className="settings-page">
      <header className="settings-hero">
        <span className="settings-eyebrow">Settings</span>
        <h1>Manage your account</h1>
        <p>Profile, plan, privacy, and notifications — tweak the parts you want.</p>
      </header>

      <div className="settings-shell">
        <aside className="settings-sidebar">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="settings-tab-icon">{t.icon}</span>
              <span className="settings-tab-label">{t.label}</span>
            </button>
          ))}
        </aside>

        <main className="settings-content">
          {activeTab === "account" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Account</h2>
              <p className="settings-section-sub">
                Your profile information. Edit details on the Profile page.
              </p>

              <div className="settings-card settings-profile-card">
                <div className="settings-profile-avatar">
                  {userProfile?.photos?.[0] ? (
                    <img src={userProfile.photos[0]} alt={userProfile?.name ?? "You"} />
                  ) : (
                    <span>{(userProfile?.name?.[0] ?? "?").toUpperCase()}</span>
                  )}
                </div>
                <div className="settings-profile-meta">
                  <div className="settings-profile-name">{userProfile?.name ?? "—"}</div>
                  <div className="settings-profile-rows">
                    <span><strong>Email</strong> {userProfile?.email || "Not set"}</span>
                    <span><strong>Phone</strong> {userProfile?.phone || "Not set"}</span>
                    <span><strong>Location</strong> {userProfile?.location || "Not set"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-btn settings-btn-primary"
                  onClick={() => onNavigate?.("profile")}
                >
                  Edit profile
                </button>
              </div>
            </section>
          )}

          {activeTab === "subscription" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Subscription</h2>
              <p className="settings-section-sub">
                Manage your plan, see usage, and unlock unlimited messaging.
              </p>

              <div className={`settings-card settings-plan-card ${isPremium ? "premium" : ""}`}>
                <div className="settings-plan-head">
                  <div>
                    <span className="settings-plan-tier">{isPremium ? "Premium" : "Free"}</span>
                    <span className="settings-plan-tag">
                      {isPremium ? "Unlimited messaging" : "$0 / month"}
                    </span>
                  </div>
                  {isPremium ? (
                    <span className="settings-pill settings-pill-active">Active</span>
                  ) : (
                    <span className="settings-pill">Current plan</span>
                  )}
                </div>

                <div className="settings-plan-stats">
                  <div className="settings-plan-stat">
                    <span className="settings-plan-stat-value">
                      {isPremium ? "∞" : `${messagesUsedToday}/${FREE_DAILY_MESSAGE_LIMIT}`}
                    </span>
                    <span className="settings-plan-stat-label">
                      {isPremium ? "Messages today" : `Today · ${messagesLeftToday} left`}
                    </span>
                  </div>
                  {isPremium && state.renewsAt && (
                    <div className="settings-plan-stat">
                      <span className="settings-plan-stat-value">
                        {new Date(state.renewsAt).toLocaleDateString()}
                      </span>
                      <span className="settings-plan-stat-label">Renews</span>
                    </div>
                  )}
                </div>

                <div className="settings-plan-actions">
                  {isPremium ? (
                    <>
                      <button
                        type="button"
                        className="settings-btn settings-btn-ghost"
                        onClick={() => onNavigate?.("subscribe")}
                      >
                        Manage plan
                      </button>
                      <button
                        type="button"
                        className="settings-btn settings-btn-danger"
                        onClick={cancel}
                      >
                        Switch to Free
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="settings-btn settings-btn-primary"
                      onClick={() => onNavigate?.("subscribe")}
                    >
                      ★ Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "privacy" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Privacy</h2>
              <p className="settings-section-sub">Control what other people can see about you.</p>

              <div className="settings-card settings-row-list">
                <Toggle
                  label="Private profile"
                  description="Only let people you approve see your profile."
                  value={settings.privateProfile}
                  onChange={() => handleToggle("privateProfile")}
                />
                <Toggle
                  label="Show online status"
                  description="Let others see when you're active."
                  value={settings.showOnlineStatus}
                  onChange={() => handleToggle("showOnlineStatus")}
                />
                <Toggle
                  label="Location tracking"
                  description="Share your location for better matches."
                  value={settings.locationTracking}
                  onChange={() => handleToggle("locationTracking")}
                />
                <Toggle
                  label="Message requests"
                  description="Allow messages from people who haven't matched with you."
                  value={settings.messageRequests}
                  onChange={() => handleToggle("messageRequests")}
                />
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Notifications</h2>
              <p className="settings-section-sub">Choose how Let's Date reaches you.</p>

              <div className="settings-card settings-row-list">
                <Toggle
                  label="Email notifications"
                  description="New likes, matches, and messages by email."
                  value={settings.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                />
                <Toggle
                  label="Push notifications"
                  description="Real-time alerts on your device."
                  value={settings.pushNotifications}
                  onChange={() => handleToggle("pushNotifications")}
                />
              </div>
            </section>
          )}

          {activeTab === "blocked" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Blocked users</h2>
              <p className="settings-section-sub">People you've blocked won't see you.</p>

              <div className="settings-card settings-empty-card">
                <span className="settings-empty-emoji">🚫</span>
                <h3>No blocked users yet</h3>
                <p>You can block someone from any chat or profile. They won't be notified.</p>
              </div>
            </section>
          )}

          {activeTab === "help" && (
            <section className="settings-section">
              <h2 className="settings-section-title">Help &amp; support</h2>
              <p className="settings-section-sub">Need a hand? Pick the right channel.</p>

              <div className="settings-help-grid">
                <a className="settings-help-card" href="mailto:support@letsdateapp.com">
                  <span className="settings-help-icon">📧</span>
                  <div>
                    <h3>Contact support</h3>
                    <p>support@letsdateapp.com — usually replies within a day.</p>
                  </div>
                  <span className="settings-help-arrow">→</span>
                </a>
                <a
                  className="settings-help-card"
                  href="mailto:support@letsdateapp.com?subject=Terms%20of%20service"
                >
                  <span className="settings-help-icon">📋</span>
                  <div>
                    <h3>Terms of service</h3>
                    <p>The legal stuff. The short version: be kind, be real.</p>
                  </div>
                  <span className="settings-help-arrow">→</span>
                </a>
                <a
                  className="settings-help-card"
                  href="mailto:support@letsdateapp.com?subject=Privacy%20policy"
                >
                  <span className="settings-help-icon">🔐</span>
                  <div>
                    <h3>Privacy policy</h3>
                    <p>How we handle your data. Your messages stay private.</p>
                  </div>
                  <span className="settings-help-arrow">→</span>
                </a>
              </div>
            </section>
          )}

          {(activeTab === "privacy" || activeTab === "notifications") && (
            <div className="settings-save-bar">
              <span className="settings-save-status">
                {dirty ? "You have unsaved changes" : "All changes saved"}
              </span>
              <button
                type="button"
                className="settings-btn settings-btn-primary"
                onClick={handleSave}
                disabled={!dirty || isSaving}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
