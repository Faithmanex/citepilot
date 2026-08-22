import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "../login/AuthForm";
import BrandLogo from "@/components/brand/BrandLogo";

export const metadata = {
  title: "Create Account — CitePilot",
  description: "Join CitePilot to audit citations, detect retractions, and format bibliographies.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <BrandLogo size="lg" />
        </Link>
        <h2 className="text-3xl font-bold text-ink tracking-tight font-serif">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#1E5E4B] hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FAF9F5] py-8 px-6 sm:px-10 shadow-xl border border-[#E6E4DC] rounded-2xl">
          <Suspense fallback={<div className="text-center py-8 text-sm text-ink-muted">Loading form...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
