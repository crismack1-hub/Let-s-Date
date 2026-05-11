import { useState } from "react";
import "../styles/SignUpPage.css";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) : value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.age || formData.age < 18) {
      setError("You must be at least 18 years old");
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
    if (!formData.phone.trim()) {
      setError("Phone number is required");
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

    const result = await onSignUp(formData);
    if (!result.success) {
      setError(result.error || "Sign up failed");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="app-title">💕 Let's Date</h1>
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
                  value={formData.age}
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
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

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
          <h3>Why Join Let's Date?</h3>
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
              <span className="feature-icon">💬</span>
              <h4>Real Conversations</h4>
              <p>Connect instantly with real-time messaging</p>
              <button
                type="button"
                className="feature-link"
                onClick={() => onViewFeature?.("real-conversations")}
              >
                Open chats →
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
