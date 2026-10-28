export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  if (response.status === 204) return undefined as T;

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string" ? result.error : `Permintaan gagal (${response.status}).`
    );
  }
  return result as T;
}

export function apiRequest<T>(path: string, init: RequestInit = {}) {
  return request<T>(path, init);
}

export function sendContactMessage(payload: ContactMessagePayload) {
  return request<void>("/api/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadMedia(
  file: File,
  folder: "projects" | "certifications" | "profile"
) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const result = await request<{ url: string }>("/api/uploads", {
    method: "POST",
    body: form,
  });
  return result.url;
}
