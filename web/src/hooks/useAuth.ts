import { useState, useEffect } from "react";
import type { SignUpData } from "../components/SignUpPage";

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
    const storedToken = localStorage.getItem("authToken");
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
      const response = await fetch("http://localhost:4000/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem("authToken");
        setToken(null);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("authToken");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("authToken", data.token);
        return { success: true };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      console.error("Login request failed:", error);
      return { success: false, error: "Unable to connect to auth server" };
    }
  };

  const signUp = async (signUpData: SignUpData) => {
    try {
      const response = await fetch("http://localhost:4000/api/auth/register", {
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
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("authToken", data.token);
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
    localStorage.removeItem("authToken");
  };

  return { user, token, loading, login, logout, signUp };
}
