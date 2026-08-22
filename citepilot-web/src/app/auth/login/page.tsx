import { Suspense } from "react";
import Link from "next/link";
import AuthForm from "./AuthForm";
import BrandLogo from "@/components/brand/BrandLogo";

export const metadata = {
  title: "Sign In — CitePilot",
  description: "Sign in to your CitePilot account to access citation auditing and saved reports.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <BrandLogo size="lg" />
        </Link>
        <h2 className="text-3xl font-bold text-ink tracking-tight font-serif">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Or{" "}
          <Link href="/auth/signup" className="font-semibold text-[#1E5E4B] hover:underline">
            create a new CitePilot account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FAF9F5] py-8 px-6 sm:px-10 shadow-xl border border-[#E6E4DC] rounded-2xl">
          <Suspense fallback={<div className="text-center py-8 text-sm text-ink-muted">Loading form...</div>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
