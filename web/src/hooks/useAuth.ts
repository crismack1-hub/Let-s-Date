import { useState, useEffect } from "react";
import type { SignUpData } from "../components/SignUpPage";
import { apiUrl } from "../api";
import { normalizePhoneNumber } from "../utils/phone";

const AUTH_TOKEN_KEY = "authToken";
const REMEMBERED_PHONE_KEY = "rememberedPhone";

function getRememberedPhone() {
  const savedValue = localStorage.getItem(REMEMBERED_PHONE_KEY) ?? "";
  const phone = normalizePhoneNumber(savedValue);
  if (!phone) {
    if (savedValue) localStorage.removeItem(REMEMBERED_PHONE_KEY);
    return "";
  }
  if (phone !== savedValue) localStorage.setItem(REMEMBERED_PHONE_KEY, phone);
  return phone;
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      // Verify token with backend
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(apiUrl("/api/auth/verify"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string, rememberMe: boolean) => {
    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        if (rememberMe) {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          localStorage.setItem(REMEMBERED_PHONE_KEY, normalizePhoneNumber(phone) ?? phone);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REMEMBERED_PHONE_KEY);
          sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
        }
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      console.error("Login request failed:", error);
      return { success: false, error: "Unable to connect to auth server" };
    }
  };

  const requestPasswordReset = async (phone: string) => {
    try {
      const response = await fetch(apiUrl("/api/auth/password-reset/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, developmentCode: data.developmentCode as string | undefined };
      }
      return { success: false, error: data.error || "Unable to request a password reset" };
    } catch (error) {
      console.error("Password reset request failed:", error);
      return { success: false, error: "Unable to connect to auth server" };
    }
  };

  const resetPassword = async (phone: string, code: string, password: string) => {
    try {
      const response = await fetch(apiUrl("/api/auth/password-reset/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, password }),
      });
      const data = await response.json();
      if (response.ok) return { success: true };
      return { success: false, error: data.error || "Unable to reset password" };
    } catch (error) {
      console.error("Password reset confirmation failed:", error);
      return { success: false, error: "Unable to connect to auth server" };
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: signUpData.phone,
          name: signUpData.name,
          password: signUpData.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        const profileResponse = await fetch(apiUrl("/api/profile"), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            name: signUpData.name,
            age: signUpData.age,
            gender: signUpData.gender,
            email: signUpData.email,
            phone: signUpData.phone,
          }),
        });
        if (!profileResponse.ok) {
          return { success: false, error: "Account created, but profile details could not be saved. Please log in and update your profile." };
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(
          REMEMBERED_PHONE_KEY,
          normalizePhoneNumber(signUpData.phone) ?? signUpData.phone,
        );
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        return { success: true };
      }
      return { success: false, error: data.error || "Sign up failed" };
    } catch (error) {
      console.error("Sign up request failed:", error);
      return { success: false, error: "Unable to connect to auth server" };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    signUp,
    requestPasswordReset,
    resetPassword,
    rememberedPhone: getRememberedPhone(),
  };
}
