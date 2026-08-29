"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const callbackError = searchParams.get("error");

  const { signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    callbackError ? "Authentication failed or expired. Please try signing in again." : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          setErrorMsg("Please enter your full name.");
          setLoading(false);
          return;
        }
        const res = await signUpWithPassword(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error.message);
        } else if (res.needsEmailVerification) {
          setSuccessMsg("Account created! Please check your email inbox to confirm your account.");
        } else {
          setSuccessMsg("Success! Redirecting to dashboard...");
          setTimeout(() => router.push(redirectPath), 1000);
        }
      } else {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setErrorMsg(res.error.message || "Invalid email or password.");
        } else {
          setSuccessMsg("Signed in! Redirecting...");
          setTimeout(() => router.push(redirectPath), 600);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    setErrorMsg(null);
    setOauthLoading(true);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setErrorMsg(res.error.message);
      setOauthLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] text-sm rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#b91c1c] mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#e6f4f2] border border-[#a7dcd4] text-[#027e6f] text-sm rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#027e6f] mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Eleanor Vance"
                className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#d9d9d9] rounded-lg text-sm text-[#0e101a] focus:outline-none focus:ring-2 focus:ring-[#027e6f] focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eleanor.vance@university.edu"
              className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#d9d9d9] rounded-lg text-sm text-[#0e101a] focus:outline-none focus:ring-2 focus:ring-[#027e6f] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707070]" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-[#ffffff] border border-[#d9d9d9] rounded-lg text-sm text-[#0e101a] focus:outline-none focus:ring-2 focus:ring-[#027e6f] focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full py-2.5 px-4 bg-[#027e6f] hover:bg-[#02665a] text-white text-sm font-semibold rounded-lg shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "signup" ? (
            <>
              Create Account <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#ebebeb]"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#ffffff] px-2 text-[#707070] font-medium">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={loading || oauthLoading}
        className="w-full py-2.5 px-4 bg-[#ffffff] hover:bg-[#f5f5f5] border border-[#0e101a] text-[#0e101a] text-sm font-semibold rounded-lg flex items-center justify-center gap-2.5 shadow-none transition-all disabled:opacity-50 cursor-pointer"
      >
        {oauthLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
}
