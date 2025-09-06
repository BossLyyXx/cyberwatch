// api.ts
const BASE_URL =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    let msg = "";
    try {
      msg = await res.text();
    } catch {}
    throw new Error(`[${res.status}] ${res.statusText}${msg ? " " + msg : ""}`);
  }
  // จัดการเคสที่ server ตอบกลับมาว่าสำเร็จแต่ไม่มี body (เช่น DELETE request)
  if (res.status === 204) {
    return Promise.resolve(undefined as T);
  }
  return res.json() as Promise<T>;
}

/* ---------------- Types ---------------- */
export type JsonMap = Record<string, any>;

export interface WatchlistSyncIn {
  id: string;
  name: string;
  image_urls?: string[];
  image_base64?: string[];
  meta?: JsonMap;
}

export interface WatchlistItemOut {
  id: string;
  name: string;
  images: number;
  meta?: JsonMap;
  first_image_base64?: string;
}

export interface MatchBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MatchItem {
  box: MatchBox;
  matched: boolean;
  name: string;
  id: string | null;
  distance: number;
  threshold: number;
}

export interface MatchResponse {
  file: string;
  faces: number;
  results: MatchItem[];
}

/* ---------------- API ---------------- */
export const api = {
  health: () => http<{ status: string; watchlist_size: number }>("/health"),

  getWatchlist: () => http<WatchlistItemOut[]>("/watchlist"),

  syncWatchlist: (entries: WatchlistSyncIn[], replace = true) =>
    http<{ added: number; failed: any[]; total: number }>(
      `/watchlist/sync?replace=${replace}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      }
    ),

  // เพิ่มฟังก์ชัน deletePerson เข้าไป
  deletePerson: (id: string) => http<void>(`/watchlist/${id}`, { method: 'DELETE' }),

  matchFile: (file: File, threshold?: number) => {
    if (!file || file.size === 0) {
      return Promise.reject(new Error("No file selected"));
    }
    const fd = new FormData();
    fd.append("image", file);
    if (typeof threshold === "number") fd.append("threshold", String(threshold));
    return http<MatchResponse>("/match", { method: "POST", body: fd });
  },

  matchBase64: (dataUrl: string, threshold?: number) => {
    if (
      !dataUrl ||
      typeof dataUrl !== "string" ||
      !dataUrl.startsWith("data:image/") ||
      !dataUrl.includes("base64,")
    ) {
      return Promise.reject(
        new Error("Invalid image_base64 (missing data URL prefix)")
      );
    }
    const fd = new FormData();
    fd.append("image_base64", dataUrl);
    if (typeof threshold === "number") fd.append("threshold", String(threshold));
    return http<MatchResponse>("/match", { method: "POST", body: fd });
  },
};

export default api;