import { useEffect, useRef, useState } from "react";
import { UserProfile } from "../types";
import { apiUrl } from "../api";
import "../styles/ProfilePage.css";

interface ProfilePageProps {
  token: string;
  user: UserProfile | null;
  onProfileUpdated?: (profile: UserProfile) => void;
}

const AVAILABLE_INTERESTS = [
  "Hiking",
  "Coffee",
  "Travel",
  "Music",
  "Movies",
  "Books",
  "Foodie",
  "Fitness",
  "Art",
  "Pets",
  "Yoga",
  "Cooking",
  "Gaming",
  "Photography",
  "Dancing",
  "Outdoors",
  "Wine",
  "Volunteering",
];

type SaveStatus = "idle" | "saving" | "saved" | "error";
type VerificationMethod = "email" | "phone";

// Pick an output MIME for the canvas re-encode based on the input file. PNG
// keeps PNG (preserves transparency); WebP stays WebP. Everything else —
// JPEG, HEIC, GIF, BMP, TIFF, AVIF, unknown — gets JPEG, which every browser
// can encode and which compresses photos well.
function pickOutputMime(file: File): { mime: string; lossy: boolean } {
  const t = (file.type || "").toLowerCase();
  if (t === "image/png") return { mime: "image/png", lossy: false };
  if (t === "image/webp") return { mime: "image/webp", lossy: true };
  return { mime: "image/jpeg", lossy: true };
}

// Resize an image File via a canvas, returning a data URL. Keeps profile
// photos under ~1MB so they fit in JSON bodies and don't bloat in-memory state.
// Preserves the original format where it matters (PNG transparency, WebP).
async function resizeImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(
          new Error(
            "This image format is not supported by your browser. Try saving it as JPEG, PNG, or WebP.",
          ),
        );
      el.src = objectUrl;
    });
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2d context unavailable.");
    ctx.drawImage(img, 0, 0, w, h);
    const { mime, lossy } = pickOutputMime(file);
    return canvas.toDataURL(mime, lossy ? quality : undefined);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfilePage({ token, user, onProfileUpdated }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile> | null>(null);
  const [ageInput, setAgeInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
      setAgeInput(String(user.age ?? ""));
      setSaveStatus("idle");
    }
  }, [user]);

  const photos = (formData?.photos ?? user?.photos ?? []) as string[];

  const handleSaveProfile = async () => {
    if (!formData) return;
    const age = Number(ageInput);
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      setSaveError("Enter an age between 18 and 120.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);
    try {
      const response = await fetch(apiUrl("/api/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, age }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Save failed (${response.status})`);
      }

      const updated = (await response.json()) as UserProfile;
      setFormData(updated);
      onProfileUpdated?.(updated);
      setIsEditing(false);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setSaveError(error?.message ?? "Could not save changes.");
      setSaveStatus("error");
    }
  };

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || !files.length || !formData) return;
    const file = files[0];
    try {
      const dataUrl = await resizeImageFile(file, 1600, 0.85);
      setFormData({ ...formData, photos: [...(formData.photos ?? []), dataUrl] });
    } catch (err) {
      console.error("Could not process image:", err);
      setSaveError("Could not read that image. Try a different file.");
      setSaveStatus("error");
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (!formData) return;
    const next = (formData.photos ?? []).filter((_, i) => i !== index);
    setFormData({ ...formData, photos: next });
  };

  const handleRequestVerification = async (method: VerificationMethod) => {
    setVerificationBusy(true);
    setVerificationError("");
    setVerificationMessage("");
    try {
      const response = await fetch(apiUrl("/api/profile/verification/request"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send a verification code.");
      setVerificationMethod(method);
      setVerificationCode("");
      setVerificationMessage(result.message);
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Could not send a verification code.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const handleConfirmVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verificationMethod) return;
    setVerificationBusy(true);
    setVerificationError("");
    setVerificationMessage("");
    try {
      const response = await fetch(apiUrl("/api/profile/verification/confirm"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method: verificationMethod, code: verificationCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not verify this contact.");
      const profileResponse = await fetch(apiUrl("/api/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error("Verification succeeded, but the profile could not be refreshed.");
      const profile = (await profileResponse.json()) as UserProfile;
      onProfileUpdated?.(profile);
      setVerificationMethod(null);
      setVerificationCode("");
      setVerificationMessage("Your profile is verified.");
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : "Could not verify this contact.");
    } finally {
      setVerificationBusy(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData(user);
      setAgeInput(String(user.age ?? ""));
    }
    setIsEditing(false);
    setSaveStatus("idle");
    setSaveError(null);
  };

  if (!user) {
    return <div className="profile-page"><p>Loading profile…</p></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button
          className="edit-btn"
          onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="profile-content">
        <div className="photos-section">
          <div className="photos-section-head">
            <h2>Photos</h2>
          </div>
          <div className="photos-grid">
            {photos.length === 0 && !isEditing && (
              <div className="photo-empty">No profile photo yet</div>
            )}
            {photos.map((photo, index) => (
              <div key={index} className="photo-item">
                <img src={photo} alt={`Photo ${index + 1}`} />
                {isEditing && (
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => handleRemovePhoto(index)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                )}
                {index === 0 && photos.length > 1 && (
                  <span className="photo-main-badge">Main</span>
                )}
              </div>
            ))}
            {isEditing && photos.length < 6 && (
              <div className="photo-item add-photo">
                <button type="button" onClick={handlePickPhoto}>
                  + Add Photo
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.avif,.bmp,.gif,.heic,.heif,.jfif,.jpe,.jpeg,.jpg,.png,.tif,.tiff,.webp"
            style={{ display: "none" }}
            onChange={(e) => {
              handlePhotoFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="info-section">
          {!isEditing && <section className="profile-verification">
            <h2>Profile verification</h2>
            <p>
              {user.verified
                ? "Your profile is verified."
                : "Verify your email address or account phone number to get a verified badge."}
            </p>
            <div className="profile-verification-actions">
              <button
                type="button"
                onClick={() => handleRequestVerification("email")}
                disabled={verificationBusy || user.emailVerified}
              >
                {user.emailVerified ? "Email verified" : "Verify email"}
              </button>
              <button
                type="button"
                onClick={() => handleRequestVerification("phone")}
                disabled={verificationBusy || user.phoneVerified}
              >
                {user.phoneVerified ? "Phone verified" : "Verify phone"}
              </button>
            </div>
            {verificationMethod && (
              <form className="profile-verification-code" onSubmit={handleConfirmVerification}>
                <label htmlFor="profile-verification-code">6-digit code</label>
                <input
                  id="profile-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  required
                />
                <button type="submit" disabled={verificationBusy || verificationCode.length !== 6}>
                  {verificationBusy ? "Checking…" : "Confirm"}
                </button>
              </form>
            )}
            {verificationMessage && <p className="verification-success" role="status">{verificationMessage}</p>}
            {verificationError && <p className="verification-error" role="alert">{verificationError}</p>}
          </section>}
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData?.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  step={1}
                  value={ageInput}
                  onChange={(e) => {
                    setAgeInput(e.target.value);
                    setSaveStatus("idle");
                    setSaveError(null);
                  }}
                />
              </div>

              <div className="contact-fieldset">
                <h4 className="contact-title">Contact info</h4>
                <p className="contact-hint">
                  Other people only see what you choose to show.
                </p>

                <div className="form-group contact-row">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={formData?.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <label className="contact-toggle">
                    <input
                      type="checkbox"
                      checked={formData?.showEmail ?? false}
                      onChange={(e) =>
                        setFormData({ ...formData, showEmail: e.target.checked })
                      }
                    />
                    <span>Show on my profile</span>
                  </label>
                </div>

                <div className="form-group contact-row">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 555 0100"
                    value={formData?.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <label className="contact-toggle">
                    <input
                      type="checkbox"
                      checked={formData?.showPhone ?? false}
                      onChange={(e) =>
                        setFormData({ ...formData, showPhone: e.target.checked })
                      }
                    />
                    <span>Show on my profile</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={formData?.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Zodiac Sign</label>
                <select
                  value={formData?.zodiacSign || ""}
                  onChange={(e) => setFormData({ ...formData, zodiacSign: e.target.value })}
                >
                  <option value="">Select…</option>
                  <option>♈ Aries</option>
                  <option>♉ Taurus</option>
                  <option>♊ Gemini</option>
                  <option>♋ Cancer</option>
                  <option>♌ Leo</option>
                  <option>♍ Virgo</option>
                  <option>♎ Libra</option>
                  <option>♏ Scorpio</option>
                  <option>♐ Sagittarius</option>
                  <option>♑ Capricorn</option>
                  <option>♒ Aquarius</option>
                  <option>♓ Pisces</option>
                </select>
              </div>

              <div className="form-group">
                <label>Interests</label>
                <p className="interests-hint">
                  Pick what you actually enjoy — these help you find people with shared interests.
                </p>
                <div className="interests-chips">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const selected = formData?.interests?.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        className={`interest-chip ${selected ? "selected" : ""}`}
                        onClick={() => {
                          const current = formData?.interests ?? [];
                          const next = selected
                            ? current.filter((i) => i !== interest)
                            : [...current, interest];
                          setFormData({ ...formData, interests: next });
                        }}
                      >
                        {selected && <span className="interest-chip-check">✓</span>}
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <span className="interests-count">
                  {formData?.interests?.length ?? 0} selected
                </span>
              </div>

              <div className="save-row">
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
                {saveStatus === "error" && (
                  <span className="save-status save-status-error">{saveError}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="profile-info">
              {saveStatus === "saved" && (
                <div className="save-banner">✓ Profile saved</div>
              )}

              <div className="info-item">
                <h3>{user.name}, {user.age}</h3>
              </div>

              <div className="info-item">
                <h4>About Me</h4>
                <p>{user.bio}</p>
              </div>

              <div className="info-grid">
                {user.zodiacSign && (
                  <div className="info-block">
                    <span className="label">Zodiac</span>
                    <span className="value">{user.zodiacSign}</span>
                  </div>
                )}
              </div>

              {user.interests && user.interests.length > 0 && (
                <div className="info-item">
                  <h4>Interests</h4>
                  <div className="interests-list">
                    {user.interests.map((interest) => (
                      <span key={interest} className="interest-badge">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(user.showEmail && user.email) || (user.showPhone && user.phone) ? (
                <div className="info-item">
                  <h4>Contact</h4>
                  <ul className="contact-list">
                    {user.showEmail && user.email && (
                      <li>
                        <span className="contact-label">📧 Email</span>
                        <a className="contact-value" href={`mailto:${user.email}`}>
                          {user.email}
                        </a>
                      </li>
                    )}
                    {user.showPhone && user.phone && (
                      <li>
                        <span className="contact-label">📞 Phone</span>
                        <a className="contact-value" href={`tel:${user.phone}`}>
                          {user.phone}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="info-item contact-hidden">
                  <h4>Contact</h4>
                  <p className="contact-hidden-note">
                    Email and phone are hidden. Edit your profile to add them and choose what to
                    show.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
