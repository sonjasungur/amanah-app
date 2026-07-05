"use client";

import { useAmanahStore, resetAmanahStore } from "@/lib/store/use-amanah-store";
import { exportToJson, exportEmergencyFolder, importFromJson } from "@/lib/storage/amanah-storage";
import { pickDataFields } from "@/lib/store/store-utils";
import { getActiveStorageLabel } from "@/lib/storage/storage-config";
import { getAuthToken } from "@/lib/auth/api-auth-provider";
import {
  openReadableEmergencyExport,
  downloadReadableEmergencyMarkdown,
} from "@/lib/export/readable-emergency-export";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useRef } from "react";
import { Save, Trash2, Download, Upload, FlaskConical, Heart, FileText } from "lucide-react";

export function StorageControls() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const storageLabel = getActiveStorageLabel();
  const isApiStorage = storageLabel === "api";

  const handleClearLocal = async () => {
    if (confirm(t("storage.clearConfirm"))) {
      await resetAmanahStore();
    }
  };

  const handleDeleteServerData = async () => {
    if (!confirm(t("storage.deleteServerConfirm"))) return;
    const token = getAuthToken();
    if (!token) {
      alert(t("storage.deleteServerNoAuth"));
      return;
    }
    try {
      const res = await fetch("/api/amanah", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Fehler");
      await resetAmanahStore();
      alert(body.message || t("storage.deleteServerSuccess"));
    } catch (e) {
      alert(e instanceof Error ? e.message : t("storage.deleteServerFailed"));
    }
  };

  const handleExport = () => {
    exportToJson(pickDataFields(store));
  };

  const handleEmergencyExport = () => {
    exportEmergencyFolder(pickDataFields(store));
  };

  const handleReadableExport = () => {
    openReadableEmergencyExport(pickDataFields(store));
  };

  const handleMarkdownExport = () => {
    downloadReadableEmergencyMarkdown(pickDataFields(store));
  };

  const handleLoadDemo = () => {
    if (
      confirm(
        t("storage.demoConfirm") +
          "\n\n" +
          t("storage.demoWarning")
      )
    ) {
      store.loadDemoData();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importFromJson(file);
    if (result.success && result.data) {
      store.importData(result.data);
      const warningMsg = result.warnings?.length ? "\n\n" + result.warnings.join("\n") : "";
      alert(t("storage.importSuccess") + warningMsg);
    } else {
      alert(t("storage.importFailed") + (result.errors?.join(", ") ?? ""));
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="rounded-2xl bg-sand border border-primary/10 p-4 space-y-3">
      <SaveStatusIndicator />
      <p className="text-sm text-muted flex items-center gap-2">
        <Save size={16} />
        {isApiStorage ? t("auth.storage.api") : t("storage.notice")}
      </p>
      <p className="text-xs text-warning">{t("storage.warning")}</p>
      <p className="text-xs text-muted">{t("export.keepSafe")}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download size={14} className="mr-1" /> {t("storage.export")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleEmergencyExport}>
          <Heart size={14} className="mr-1" /> {t("storage.emergencyExport")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReadableExport}>
          <FileText size={14} className="mr-1" /> {t("export.readableBtn")}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleMarkdownExport}>
          {t("export.markdownBtn")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload size={14} className="mr-1" /> {t("storage.import")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleLoadDemo}>
          <FlaskConical size={14} className="mr-1" /> {t("storage.loadDemo")}
        </Button>
        {isApiStorage ? (
          <Button size="sm" variant="danger" onClick={handleDeleteServerData}>
            <Trash2 size={14} className="mr-1" /> {t("storage.deleteServer")}
          </Button>
        ) : (
          <Button size="sm" variant="danger" onClick={handleClearLocal}>
            <Trash2 size={14} className="mr-1" /> {t("storage.resetLocal")}
          </Button>
        )}
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
