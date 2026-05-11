import { useEffect, useRef, useState } from "react";
import { UserProfile } from "../types";
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

export function ProfilePage({ token, user, onProfileUpdated }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
      setSaveStatus("idle");
    }
  }, [user]);

  const photos = (formData?.photos ?? user?.photos ?? []) as string[];

  const handleSaveProfile = async () => {
    if (!formData) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setFormData({ ...formData, photos: [...(formData.photos ?? []), dataUrl] });
  };

  const handleRemovePhoto = (index: number) => {
    if (!formData) return;
    const next = (formData.photos ?? []).filter((_, i) => i !== index);
    setFormData({ ...formData, photos: next });
  };

  const handleCancelEdit = () => {
    if (user) setFormData(user);
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
            {isEditing && photos.length > 0 && (
              <span className="photos-hint">
                Add up to 6 — first photo is your main profile picture.
              </span>
            )}
          </div>
          <div className="photos-grid">
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
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              handlePhotoFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="info-section">
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

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={formData?.age ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, age: parseInt(e.target.value) || 18 })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData?.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="text"
                    value={formData?.height || ""}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Body Type</label>
                  <select
                    value={formData?.bodyType || ""}
                    onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                  >
                    <option value="">Select…</option>
                    <option>Slim</option>
                    <option>Athletic</option>
                    <option>Average</option>
                    <option>Curvy</option>
                    <option>Muscular</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
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
                  <label>Education</label>
                  <input
                    type="text"
                    value={formData?.education || ""}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Interests</label>
                <p className="interests-hint">
                  Pick what you actually enjoy — these surface in Smart Discovery and Better Matches.
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
                <p className="location">📍 {user.location}</p>
              </div>

              <div className="info-item">
                <h4>About Me</h4>
                <p>{user.bio}</p>
              </div>

              <div className="info-grid">
                {user.height && (
                  <div className="info-block">
                    <span className="label">Height</span>
                    <span className="value">{user.height}</span>
                  </div>
                )}
                {user.bodyType && (
                  <div className="info-block">
                    <span className="label">Body Type</span>
                    <span className="value">{user.bodyType}</span>
                  </div>
                )}
                {user.education && (
                  <div className="info-block">
                    <span className="label">Education</span>
                    <span className="value">{user.education}</span>
                  </div>
                )}
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
