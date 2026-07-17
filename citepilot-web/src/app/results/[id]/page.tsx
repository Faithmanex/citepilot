"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

type Tab = "summary" | "citations" | "references" | "annotated" | "style";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<any>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [annotated, setAnnotated] = useState<any>(null);
  const [styleWarnings, setStyleWarnings] = useState<any[]>([]);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      const docRes = await api.getDocument(id);
      setDoc(docRes.data.document);

      if (docRes.data.document.status === "analysed" || docRes.data.document.status === "validated") {
        const [sumRes, citRes, refRes, annRes, styleRes] = await Promise.all([
          api.getResultsSummary(id),
          api.getCitations(id),
          api.getReferences(id),
          api.getAnnotatedDocument(id),
          api.getStyleWarnings(id),
        ]);
        setSummary(sumRes.data.summary);
        setCitations(citRes.data.citations);
        setReferences(refRes.data.references);
        setAnnotated(annRes.data.annotatedDocument);
        setStyleWarnings(styleRes.data.styleWarnings);
        setPolling(false);
      } else if (
        docRes.data.document.status === "uploaded" ||
        docRes.data.document.status === "analysing" ||
        docRes.data.document.status === "parsing"
      ) {
        setPolling(true);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    if (!polling || !id) return;
    const interval = setInterval(async () => {
      try {
        const st = await api.getDocumentStatus(id);
        if (st.data.status === "analysed" || st.data.status === "validated" || st.data.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          loadAll();
        }
        setDoc((prev: any) => prev ? { ...prev, status: st.data.status, progress: st.data.progress } : prev);
      } catch {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, id, loadAll]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!user) return null;

  const isProcessing = doc?.status === "uploaded" || doc?.status === "parsing" || doc?.status === "analysing";

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "citations", label: "Citations" },
    { key: "references", label: "References" },
    { key: "annotated", label: "Annotated View" },
    { key: "style", label: "Style Warnings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
            <h1 className="text-lg font-bold text-blue-600">CitePilot</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">{doc?.label ?? doc?.filename ?? "Document"}</h2>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium">{doc?.status}</span>
            {isProcessing && doc?.progress != null && ` · ${doc.progress}%`}
          </p>
        </div>

        {isProcessing ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <p className="text-lg font-medium">Analysing your document...</p>
            <p className="mt-2 text-sm text-gray-500">
              Extracting citations, parsing references, and checking for issues.
              This usually takes 15–60 seconds.
            </p>
            {doc?.progress != null && (
              <div className="mx-auto mt-4 h-2 w-64 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${doc.progress}%` }}
                />
              </div>
            )}
          </div>
        ) : doc?.status === "failed" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-lg font-medium text-red-700">Analysis failed</p>
            <p className="mt-2 text-sm text-red-600">{doc?.errorMessage ?? "An unexpected error occurred."}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 border-b">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                    tab === t.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "summary" && summary && <SummaryTab summary={summary} />}
            {tab === "citations" && <CitationsTab citations={citations} />}
            {tab === "references" && <ReferencesTab references={references} />}
            {tab === "annotated" && annotated && <AnnotatedTab annotated={annotated} />}
            {tab === "style" && <StyleTab warnings={styleWarnings} />}
          </>
        )}
      </main>
    </div>
  );
}

function SummaryTab({ summary }: { summary: any }) {
  const counts = summary.counts ?? summary;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Citations" value={counts.totalCitations ?? 0} />
        <StatCard label="Total References" value={counts.totalReferences ?? 0} colour="green" />
        <StatCard label="Matched" value={counts.matched ?? 0} colour="green" />
        <StatCard label="No Match" value={counts.noMatch ?? 0} colour="red" />
        <StatCard label="Possible Match" value={counts.possibleMatch ?? 0} colour="yellow" />
        <StatCard label="Style Warnings" value={counts.styleWarnings ?? 0} colour="yellow" />
        <StatCard label="Orphaned References" value={counts.orphanedReferences ?? 0} colour="orange" />
        <StatCard label="Ignored" value={counts.ignored ?? 0} colour="gray" />
      </div>
      {summary.processingTimeMs != null && (
        <p className="text-sm text-gray-500">Processing time: {(summary.processingTimeMs / 1000).toFixed(1)}s</p>
      )}
    </div>
  );
}

function StatCard({ label, value, colour }: { label: string; value: number; colour?: string }) {
  const colours: Record<string, string> = {
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    gray: "text-gray-500",
  };
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colours[colour ?? ""] ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function CitationsTab({ citations }: { citations: any[] }) {
  if (citations.length === 0) return <p className="text-gray-500">No citations found.</p>;
  return (
    <div className="space-y-3">
      {citations.map((c: any) => (
        <div key={c.id} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-mono text-sm font-medium">{c.inTextCitation}</p>
              <p className="mt-1 text-sm text-gray-600">{c.position?.context}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2 py-1">
                  Authors: {c.extractedAuthors?.join(", ") ?? "N/A"}
                </span>
                {c.extractedYear && (
                  <span className="rounded bg-gray-100 px-2 py-1">Year: {c.extractedYear}</span>
                )}
                {c.confidence != null && (
                  <span className="rounded bg-gray-100 px-2 py-1">
                    Confidence: {(c.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <span className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              c.status === "matched" ? "bg-green-100 text-green-700" :
              c.status === "possible_match" ? "bg-yellow-100 text-yellow-700" :
              c.status === "no_match" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {c.status}
            </span>
          </div>
          {c.matchedReference && (
            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-800">Matched to:</p>
              <p className="text-blue-700">{c.matchedReference.formattedEntry}</p>
            </div>
          )}
          {c.issues?.length > 0 && (
            <div className="mt-3 space-y-1">
              {c.issues.map((issue: any, i: number) => (
                <p key={i} className="text-sm text-red-600">⚠ {issue.message}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReferencesTab({ references }: { references: any[] }) {
  if (references.length === 0) return <p className="text-gray-500">No references found.</p>;
  return (
    <div className="space-y-3">
      {references.map((r: any) => (
        <div key={r.id} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">{r.rawEntry}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {r.parsedMetadata?.year && (
                  <span className="rounded bg-gray-100 px-2 py-1">Year: {r.parsedMetadata.year}</span>
                )}
                {r.parsedMetadata?.doi && (
                  <span className="rounded bg-gray-100 px-2 py-1">DOI: {r.parsedMetadata.doi}</span>
                )}
                {r.parsedMetadata?.type && (
                  <span className="rounded bg-gray-100 px-2 py-1">{r.parsedMetadata.type}</span>
                )}
              </div>
            </div>
            <span className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              r.status === "cited" ? "bg-green-100 text-green-700" :
              r.status === "orphaned" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {r.status} ({r.citationCount ?? 0} citations)
            </span>
          </div>
          {r.issues?.length > 0 && (
            <div className="mt-3 space-y-1">
              {r.issues.map((issue: any, i: number) => (
                <p key={i} className="text-sm text-red-600">⚠ {issue.message}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AnnotatedTab({ annotated }: { annotated: any }) {
  const paragraphs = annotated.paragraphs ?? [];
  if (paragraphs.length === 0) return <p className="text-gray-500">No document text available.</p>;
  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-4 text-sm font-medium text-gray-500">Annotated Document View</h3>
      {paragraphs.map((para: any) => {
        if (!para.text) return null;
        const annotations = para.annotations ?? [];
        if (annotations.length === 0) {
          return <p key={para.index} className="mb-3 text-sm leading-relaxed">{para.text}</p>;
        }
        const parts: { text: string; colour?: string; citationId?: string }[] = [];
        let pos = 0;
        const sorted = [...annotations].sort((a, b) => a.charStart - b.charStart);
        for (const ann of sorted) {
          if (ann.charStart > pos) parts.push({ text: para.text.slice(pos, ann.charStart) });
          parts.push({ text: para.text.slice(ann.charStart, ann.charEnd), colour: ann.colour, citationId: ann.citationId });
          pos = ann.charEnd;
        }
        if (pos < para.text.length) parts.push({ text: para.text.slice(pos) });

        return (
          <p key={para.index} className="mb-3 text-sm leading-relaxed">
            {parts.map((p, i) =>
              p.colour ? (
                <span
                  key={i}
                  className={`rounded px-0.5 ${
                    p.colour === "green" ? "bg-green-100 text-green-800" :
                    p.colour === "orange" ? "bg-yellow-100 text-yellow-800" :
                    p.colour === "red" ? "bg-red-100 text-red-800" :
                    "bg-gray-100"
                  }`}
                  title={`Citation: ${p.citationId}`}
                >
                  {p.text}
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

function StyleTab({ warnings }: { warnings: any[] }) {
  if (warnings.length === 0) return <p className="text-gray-500">No style warnings found.</p>;
  return (
    <div className="space-y-3">
      {warnings.map((w: any) => (
        <div key={w.id} className="rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium">{w.code}</p>
              <p className="mt-1 text-sm text-gray-600">{w.message}</p>
              {w.suggestion && (
                <p className="mt-2 text-sm text-blue-600">Suggestion: {w.suggestion}</p>
              )}
            </div>
            <span className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              w.severity === "error" ? "bg-red-100 text-red-700" :
              w.severity === "warning" ? "bg-yellow-100 text-yellow-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {w.severity}
            </span>
          </div>
          {w.styleGuideRef && (
            <p className="mt-2 text-xs text-gray-400">See: {w.styleGuideRef}</p>
          )}
        </div>
      ))}
    </div>
  );
}
