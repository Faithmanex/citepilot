import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export default function NotFound() {
  return (
    <div className="bg-paper min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <BrandLogo variant="light" size="lg" />
      </div>

      <div className="font-mono text-[80px] font-black text-ink leading-none mb-4">
        404
      </div>

      <h1 className="font-type font-bold text-2xl text-ink mb-3">
        Page not found
      </h1>
      <p className="text-ink-soft font-medium max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
