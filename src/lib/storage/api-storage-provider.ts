import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getAuthToken } from "@/lib/auth/api-auth-provider";
import type { StorageProvider } from "./types";

export class ApiStorageProvider implements StorageProvider {
  private getHeaders(): HeadersInit {
    const token = getAuthToken();
    if (!token) throw new Error("Nicht angemeldet — Server-Speicherung erfordert Anmeldung.");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async load(): Promise<AmanahOrdnerData | null> {
    const res = await fetch("/api/amanah", { headers: this.getHeaders() });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("Laden vom Server fehlgeschlagen.");
    const body = await res.json();
    return normalizeData(body.data ?? {});
  }

  async save(data: AmanahOrdnerData): Promise<void> {
    const res = await fetch("/api/amanah", {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Speichern auf dem Server fehlgeschlagen.");
  }

  async clear(): Promise<void> {
    const res = await fetch("/api/amanah", {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error("Löschen der Server-Daten fehlgeschlagen.");
  }
}

export const apiStorageProvider = new ApiStorageProvider();
