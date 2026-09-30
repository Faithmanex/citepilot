import type { AuditResponse } from "./types";

function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  // Same-origin Next.js Route Handlers. No external host fallback.
  return typeof window !== "undefined"
    ? `${window.location.origin}/api/v1`
    : "/api/v1";
}

async function request(
  url: string,
  init?: RequestInit,
  fallbackError = "API request failed"
): Promise<Response> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    let errorMsg = fallbackError;
    try {
      const errData = await resp.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return resp;
}

export async function runAudit(formData: FormData): Promise<AuditResponse> {
  const resp = await request(`${getApiBase()}/analyse`, {
    method: "POST",
    body: formData,
  }, "API server returned error");
  return resp.json();
}

export async function exportPdf(data: AuditResponse): Promise<Blob> {
  const resp = await request(
    `${getApiBase()}/export/pdf`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Export PDF failed"
  );
  return resp.blob();
}

export async function exportDocx(
  text: string,
  analysisData?: AuditResponse | null,
  mode: "clean" | "redline" = "redline"
): Promise<Blob> {
  const resp = await request(
    `${getApiBase()}/export/docx`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, analysis_data: analysisData || {}, mode }),
    },
    "Export DOCX failed"
  );
  return resp.blob();
}

