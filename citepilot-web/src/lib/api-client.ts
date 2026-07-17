const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

interface ApiError {
  code: string;
  message: string;
  field?: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: { requestId?: string; pagination?: { cursor: string | null; limit: number; hasMore: boolean } };
}

interface ApiErrorResponse {
  data: null;
  errors: ApiError[];
  meta?: { requestId?: string };
}

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    isFormData?: boolean,
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${path}`;
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) {
      return { data: null as T };
    }

    const json = await res.json();

    if (!res.ok) {
      const err = json as ApiErrorResponse;
      const first = err.errors?.[0];
      throw new Error(first?.message ?? `Request failed: ${res.status}`);
    }

    return json as ApiResponse<T>;
  }

  // Auth
  register(email: string, password: string, name: string) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>("POST", "/auth/register", { email, password, name });
  }

  login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; tokenType: string; expiresIn: number; user: any }>("POST", "/auth/login", { email, password });
  }

  refresh(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>("POST", "/auth/refresh", { refreshToken });
  }

  logout(refreshToken: string) {
    return this.request<void>("POST", "/auth/logout", { refreshToken });
  }

  // Documents
  listDocuments(cursor?: string, limit = 25, status?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    if (status) params.set("status", status);
    return this.request<{ documents: any[]; pagination: any }>("GET", `/documents?${params}`);
  }

  getDocument(id: string) {
    return this.request<{ document: any }>("GET", `/documents/${id}`);
  }

  getDocumentStatus(id: string) {
    return this.request<{ status: string; progress: number; currentStage?: string; message?: string }>("GET", `/documents/${id}/status`);
  }

  uploadDocument(file: File, citationStyle: string, label?: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("citationStyle", citationStyle);
    if (label) form.append("label", label);
    return this.request<{ document: any; statusUrl: string }>("POST", "/documents/upload", form, true);
  }

  pasteDocument(text: string, citationStyle: string, label?: string) {
    return this.request<{ document: any; statusUrl: string }>("POST", "/documents/paste", { text, citationStyle, label });
  }

  deleteDocument(id: string) {
    return this.request<void>("DELETE", `/documents/${id}`);
  }

  triggerAnalysis(id: string) {
    return this.request<{ documentId: string; status: string }>("POST", `/documents/${id}/analyse`);
  }

  // Results
  getResultsSummary(id: string) {
    return this.request<{ summary: any }>("GET", `/documents/${id}/results/summary`);
  }

  getCitations(id: string, cursor?: string, limit = 50, status?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    if (status) params.set("status", status);
    return this.request<{ citations: any[]; pagination: any }>("GET", `/documents/${id}/results/citations?${params}`);
  }

  getReferences(id: string, cursor?: string, limit = 50, status?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    if (status) params.set("status", status);
    return this.request<{ references: any[]; pagination: any }>("GET", `/documents/${id}/results/references?${params}`);
  }

  getAnnotatedDocument(id: string) {
    return this.request<{ annotatedDocument: any }>("GET", `/documents/${id}/results/annotated`);
  }

  getStyleWarnings(id: string) {
    return this.request<{ styleWarnings: any[] }>("GET", `/documents/${id}/results/style-warnings`);
  }
}

export const api = new ApiClient();
