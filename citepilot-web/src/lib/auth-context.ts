"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "./api-client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    api.setTokens(res.data.accessToken, res.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await api.register(email, password, name);
    api.setTokens(res.data.accessToken, res.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) {
      try { await api.logout(rt); } catch { /* ignore */ }
    }
    api.clearTokens();
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, register, logout } },
    children,
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
