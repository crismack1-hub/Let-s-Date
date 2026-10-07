import { useState } from "react";
import "../styles/SignUpPage.css";
import { normalizePhoneNumber } from "../utils/phone";
import { PhoneNumberInput } from "./PhoneNumberInput";

function secureRandomIndex(max: number) {
  const range = 0x1_0000_0000;
  const limit = range - (range % max);
  const value = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
}

function generatePasswordSuggestion() {
  const characterSets = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*+-=?",
  ];
  const characters = characterSets.map(
    (set) => set[secureRandomIndex(set.length)],
  );
  const allCharacters = characterSets.join("");

  while (characters.length < 18) {
    characters.push(allCharacters[secureRandomIndex(allCharacters.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

interface SignUpPageProps {
  onSignUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  onBackToLogin: () => void;
  onViewFeature?: (page: string) => void;
  isLoading: boolean;
}

export interface SignUpData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  age: number;
}

export function SignUpPage({ onSignUp, onBackToLogin, onViewFeature, isLoading }: SignUpPageProps) {
  const [ageInput, setAgeInput] = useState("18");
  const [formData, setFormData] = useState<SignUpData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: 18,
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // Multi-step form
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "age") {
      setAgeInput(value);
      setFormData((prev) => ({ ...prev, age: value === "" ? 0 : Number(value) }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!Number.isInteger(formData.age) || formData.age < 18 || formData.age > 120) {
      setError("Enter an age between 18 and 120");
      return false;
    }
    if (!formData.gender) {
      setError("Please select your gender");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (!normalizePhoneNumber(formData.phone)) {
      setError("Enter a valid phone number. Start with + and the country code if needed.");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const normalizedPhone = normalizePhoneNumber(formData.phone);
    if (!normalizedPhone) {
      setError("Enter a valid phone number. Start with + and the country code if needed.");
      return;
    }

    const result = await onSignUp({ ...formData, phone: normalizedPhone });
    if (!result.success) {
      setError(result.error || "Sign up failed");
    }
  };

  const handleSuggestPassword = () => {
    try {
      const password = generatePasswordSuggestion();
      setFormData((prev) => ({ ...prev, password, confirmPassword: password }));
      setShowPassword(true);
      setError("");
    } catch (suggestionError) {
      console.error("Secure password generation failed:", suggestionError);
      setError("Unable to generate a secure password in this browser.");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="app-title">
            <a className="app-home-link" href="/" aria-label="Let's Chat home">💬 Let's Chat</a>
          </h1>
          <p className="app-subtitle">Join millions finding love</p>
        </div>

        {step === 1 ? (
          <form className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  min="18"
                  max="120"
                  step="1"
                  value={ageInput}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="button"
              className="signup-btn"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              Next
            </button>
          </form>
        ) : (
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <PhoneNumberInput
                id="phone"
                name="phone"
                autoComplete="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(phone) => setFormData((previous) => ({ ...previous, phone }))}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="link-btn suggest-password-btn"
                onClick={handleSuggestPassword}
                disabled={isLoading}
              >
                Suggest a strong password
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <label className="show-password-toggle">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                disabled={isLoading}
              />
              Show password
            </label>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="back-btn"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </button>
              <button type="submit" className="signup-btn" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <button type="button" className="link-btn" onClick={onBackToLogin}>
              Login here
            </button>
          </p>
        </div>

        <div className="signup-features">
          <h3>Why Join Let's Chat?</h3>
          <div className="features-showcase">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <h4>Smart Discovery</h4>
              <p>Find compatible matches with advanced filters</p>
              <button
                type="button"
                className="feature-link"
                onClick={() => onViewFeature?.("feature-smart-discovery")}
              >
                Learn more →
              </button>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <h4>Verified Profiles</h4>
              <p>Match with verified and authentic people</p>
              <button
                type="button"
                className="feature-link"
                onClick={() => onViewFeature?.("feature-verified-profiles")}
              >
                Learn more →
              </button>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💞</span>
              <h4>Better Matches</h4>
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
    </div>
  );
}
