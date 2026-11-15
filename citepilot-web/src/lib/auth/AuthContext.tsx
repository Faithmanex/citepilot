"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "@/lib/supabase/config";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: "user" | "institutional_admin" | "super_admin";
  tier: "free" | "student" | "professional" | "institutional";
  avatar_url?: string | null;
  created_at?: string;
}

export interface UserSubscription {
  id: string;
  tier: string;
  status: string;
  billing_cycle?: string;
  current_period_end?: string;
  paypal_subscription_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  subscription: UserSubscription | null;
  loading: boolean;
  isPro: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signInWithOAuth: (provider: "google") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const fetchProfileAndSubscription = useCallback(async (authUser: User) => {
    if (!supabase) return;
    try {
      // 1. Fetch profile from public.users
      const { data: userProfile, error: profileErr } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (userProfile && !profileErr) {
        // 2. Fetch subscription if user profile exists
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userProfile.id)
          .eq("status", "active")
          .maybeSingle();

        // A subscription row can outlive its paid period (cancellation, missed
        // renewal). The UI must not advertise Pro access the server will refuse.
        const periodEnd = subData?.current_period_end
          ? new Date(subData.current_period_end as string)
          : null;
        const expired = Boolean(periodEnd && periodEnd.getTime() <= Date.now());

        setProfile(
          expired
            ? { ...(userProfile as UserProfile), tier: "free" }
            : (userProfile as UserProfile)
        );
        setSubscription(expired ? null : ((subData as UserSubscription) ?? null));
      } else {
        // Fallback profile from auth metadata if not yet created by trigger.
        // Tier always falls back to "free": user metadata is client-writable,
        // so it can never grant a paid entitlement.
        const meta = authUser.user_metadata || {};
        const fallbackProfile: UserProfile = {
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email || "",
          name: meta.full_name || meta.name || (authUser.email ? authUser.email.split("@")[0] : "Researcher"),
          role: "user",
          tier: "free",
          avatar_url: meta.avatar_url || null,
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.warn("Could not load user profile:", err);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    // Check active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfileAndSubscription(currentSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfileAndSubscription(newSession.user);
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [supabase, fetchProfileAndSubscription]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfileAndSubscription(user);
    }
  }, [user, fetchProfileAndSubscription]);

  const signInWithPassword = async (email: string, password: string) => {
    if (!supabase) return { error: new Error(SUPABASE_NOT_CONFIGURED_MESSAGE) };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: new Error(SUPABASE_NOT_CONFIGURED_MESSAGE) };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            tier: "free",
          },
        },
      });
      if (error) return { error };
      const needsEmailVerification = !data.session && !!data.user;
      return { error: null, needsEmailVerification };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithOAuth = async (provider: "google") => {
    if (!supabase) return { error: new Error(SUPABASE_NOT_CONFIGURED_MESSAGE) };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
  };

  const isPro =
    profile?.tier === "student" ||
    profile?.tier === "professional" ||
    profile?.tier === "institutional" ||
    subscription?.status === "active";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        loading,
        isPro,
        signInWithPassword,
        signUpWithPassword,
        signInWithOAuth,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
