"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

const STYLES = [
  { value: "apa7", label: "APA 7th" },
  { value: "apa6", label: "APA 6th" },
  { value: "harvard", label: "Harvard" },
  { value: "vancouver", label: "Vancouver" },
  { value: "chicago-author-date", label: "Chicago (Author-Date)" },
  { value: "chicago-notes", label: "Chicago (Notes)" },
  { value: "mla9", label: "MLA 9th" },
  { value: "ieee", label: "IEEE" },
  { value: "oscola", label: "OSCOLA" },
  { value: "turabian", label: "Turabian" },
];

export default function Dashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const loadDocs = useCallback(async () => {
    try {
      const res = await api.listDocuments();
      setDocuments(res.data.documents);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadDocs();
  }, [user, loadDocs]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("file") as File;
    const style = form.get("style") as string;
    const label = form.get("label") as string;

    if (!file || !style) return;
    setUploading(true);
    try {
      const res = await api.uploadDocument(file, style, label || undefined);
      await api.triggerAnalysis(res.data.document.id);
      setShowUpload(false);
      loadDocs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  const statusColour: Record<string, string> = {
    uploaded: "bg-gray-100 text-gray-700",
    parsing: "bg-blue-100 text-blue-700",
    analysing: "bg-yellow-100 text-yellow-700",
    analysed: "bg-green-100 text-green-700",
    validated: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">CitePilot</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Documents</h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {showUpload ? "Cancel" : "Upload Document"}
          </button>
        </div>

        {showUpload && (
          <form onSubmit={handleUpload} className="mb-8 rounded-xl border bg-white p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">File (PDF or DOCX)</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.docx,.txt"
                  required
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Citation Style</label>
                <select name="style" required className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">Select style...</option>
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Label (optional)</label>
                <input
                  type="text"
                  name="label"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g. Chapter 3 — Literature Review"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? "Uploading & Analysing..." : "Upload & Analyse"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed bg-white p-12 text-center">
            <p className="text-gray-500">No documents yet. Upload your first PDF or DOCX to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/results/${doc.id}`}
                className="block rounded-xl border bg-white p-4 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{doc.label ?? doc.filename ?? "Untitled"}</h3>
                    <p className="text-sm text-gray-500">
                      {doc.filename ? `${doc.filename} · ` : ""}
                      <span className="capitalize">{doc.citationStyle}</span>
                      {doc.wordCount ? ` · ${doc.wordCount.toLocaleString()} words` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColour[doc.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
