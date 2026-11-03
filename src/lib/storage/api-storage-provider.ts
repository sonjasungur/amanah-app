import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { hasAuthSession } from "@/lib/auth/api-auth-provider";
import { FOLDER_UNREADABLE_CODE, FolderUnreadableError, type FolderWriteScope, type SaveResult, type StorageProvider } from "./types";

async function throwIfFolderUnreadable(res: Response): Promise<void> {
  if (res.status !== 503) return;
  const { code, error } = (await res.clone().json().catch(() => ({}))) as { code?: string; error?: string };
  if (code === FOLDER_UNREADABLE_CODE) throw new FolderUnreadableError(error);
}

export class ApiStorageProvider implements StorageProvider {
  private writeScope: FolderWriteScope = "full";

  lastWriteScope(): FolderWriteScope {
    return this.writeScope;
  }

  private getHeaders(): HeadersInit {
    if (!hasAuthSession()) throw new Error("Nicht angemeldet — Server-Speicherung erfordert Anmeldung.");
    return { "Content-Type": "application/json" };
  }

  async load(): Promise<AmanahOrdnerData | null> {
    const res = await fetch("/api/amanah", { headers: this.getHeaders() });
    if (res.status === 401) return null;
    await throwIfFolderUnreadable(res);
    if (!res.ok) throw new Error("Laden vom Server fehlgeschlagen.");
    const body = await res.json();
    this.writeScope = body.writeScope === "free_sections" ? "free_sections" : "full";
    return normalizeData(body.data ?? {});
  }

  async save(data: AmanahOrdnerData): Promise<SaveResult> {
    const res = await fetch("/api/amanah", {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    await throwIfFolderUnreadable(res);
    if (res.status === 413 || res.status === 422) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(error ?? "Die Daten sind zu groß zum Speichern.");
    }
    if (!res.ok) throw new Error("Speichern auf dem Server fehlgeschlagen.");
    const { notStored, nearLimit } = (await res.json().catch(() => ({}))) as SaveResult;
    return { notStored: Array.isArray(notStored) ? notStored : [], nearLimit: nearLimit === true };
  }

  /** While a page goes away, browsers only finish small requests sent with keepalive. */
  saveWhileLeaving(body: string): void {
    void fetch("/api/amanah", { method: "PUT", headers: this.getHeaders(), body, keepalive: true }).catch(() => undefined);
  }

  async clear(): Promise<void> {
    const res = await fetch("/api/amanah", {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    await throwIfFolderUnreadable(res);
    if (!res.ok) throw new Error("Löschen der Server-Daten fehlgeschlagen.");
  }
}

export const apiStorageProvider = new ApiStorageProvider();
