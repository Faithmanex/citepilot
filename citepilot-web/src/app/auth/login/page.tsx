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
    <div className="min-h-screen bg-[#faf6ec] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <BrandLogo size="lg" />
        </Link>
        <h2 className="text-3xl font-extrabold text-[#221d16] tracking-tight font-display">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-[#5c5344]">
          Or{" "}
          <Link href="/auth/signup" className="font-semibold text-[#2c3e8c] hover:underline">
            create a new CitePilot account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#ffffff] py-8 px-6 sm:px-10 shadow-none border border-[#d9cfb8] rounded-lg">
          <Suspense fallback={<div className="text-center py-8 text-sm text-[#5c5344]">Loading form...</div>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
