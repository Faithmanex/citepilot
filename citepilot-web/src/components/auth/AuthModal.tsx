"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { X, Mail, Lock, User, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signup",
  onSuccess,
}: AuthModalProps) {
  const { signInWithPassword, signUpWithPassword, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
          setSuccessMsg("Check your inbox for a confirmation link to activate your account.");
        } else {
          setSuccessMsg("Account created successfully!");
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 1000);
        }
      } else {
        const res = await signInWithPassword(email, password);
        if (res.error) {
          setErrorMsg(res.error.message || "Invalid email or password.");
        } else {
          setSuccessMsg("Signed in successfully!");
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#FAF9F5] rounded-2xl shadow-2xl border border-[#E6E4DC] overflow-hidden p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors p-1.5 rounded-full hover:bg-[#EAE8E0]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1E5E4B]/10 text-[#1E5E4B] mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-ink tracking-tight font-serif">
            {mode === "signup" ? "Create your CitePilot Account" : "Welcome Back"}
          </h3>
          <p className="text-sm text-ink-muted mt-1">
            {mode === "signup"
              ? "Join researchers worldwide to audit citations with high precision."
              : "Sign in to access your saved audit reports and subscription perks."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Eleanor Vance"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5D2C7] rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#1E5E4B] focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor.vance@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5D2C7] rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#1E5E4B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5D2C7] rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#1E5E4B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full py-2.5 px-4 bg-[#1E5E4B] hover:bg-[#164739] text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E0D8]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#FAF9F5] px-2 text-ink-muted font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={loading || oauthLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-[#F2F0E8] border border-[#D5D2C7] text-ink text-sm font-medium rounded-lg flex items-center justify-center gap-2.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
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

        <div className="mt-6 text-center text-xs text-ink-muted">
          {mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#1E5E4B] font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#1E5E4B] font-bold hover:underline cursor-pointer"
              >
                Create one now
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
