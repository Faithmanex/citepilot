import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">CitePilot</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mb-4 text-5xl font-bold tracking-tight">
            AI-Powered Citation Checking
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Upload your academic document and instantly check every in-text citation
            against your reference list. Supports APA, MLA, Harvard, Chicago, and more.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            Get Started Free
          </Link>
        </section>

        <section className="border-t bg-white px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="rounded-xl border p-6">
              <h3 className="mb-2 font-semibold">Upload & Analyse</h3>
              <p className="text-sm text-gray-600">
                Drag-and-drop your PDF or DOCX. Our AI extracts every citation and
                reference automatically.
              </p>
            </div>
            <div className="rounded-xl border p-6">
              <h3 className="mb-2 font-semibold">Smart Matching</h3>
              <p className="text-sm text-gray-600">
                Each citation is matched to its reference with confidence scores.
                Missing references are flagged instantly.
              </p>
            </div>
            <div className="rounded-xl border p-6">
              <h3 className="mb-2 font-semibold">Style Compliance</h3>
              <p className="text-sm text-gray-600">
                Get style warnings for APA, MLA, Chicago, Harvard, Vancouver, IEEE,
                and more — including formatting corrections.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
