// Shared API client. Reads/writes JSON. Sends auth cookie via `credentials: "include"`.
// Non-2xx responses are turned into `ApiError` using the standard envelope
// `{ error: { code, message, details } }` defined in API_CONTRACT_DRAFT.md.
// No logging here on purpose — keeps PII (phones, raw payloads) out of consoles.

export type ApiErrorEnvelope = {
  error: { code: string; message: string; details?: Record<string, unknown> };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function request<T>(
  method: Method,
  path: string,
  body?: unknown
): Promise<T> {
  const hasBody = body !== undefined;
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: hasBody ? { "content-type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  // Note: assumes the server always returns JSON (or an empty body). A non-JSON
  // 5xx (e.g., raw HTML) will surface as a SyntaxError — acceptable for Sprint 1.
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const env = (data ?? {}) as Partial<ApiErrorEnvelope>;
    throw new ApiError(
      res.status,
      env.error?.code ?? "UNKNOWN",
      env.error?.message ?? `Request failed (${res.status})`,
      env.error?.details ?? {}
    );
  }

  return data as T;
}

export const apiGet = <T>(path: string): Promise<T> =>
  request<T>("GET", path);

export const apiPost = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>("POST", path, body);

export const apiPatch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>("PATCH", path, body);

export const apiDelete = <T>(path: string): Promise<T> =>
  request<T>("DELETE", path);
