"use client";

import { useAmanahStore, resetAmanahStore } from "@/lib/store/use-amanah-store";
import { useActiveStorageLabel } from "@/lib/storage/use-storage-label";
import { exportToJson, exportEmergencyFolder, importFromJson } from "@/lib/storage/amanah-storage";
import { pickDataFields } from "@/lib/store/store-utils";
import {
  openReadableEmergencyExport,
  downloadReadableEmergencyMarkdown,
} from "@/lib/export/readable-emergency-export";
import Link from "next/link";
import { Button, linkButtonClassName } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useRef } from "react";
import { Trash2, Download, Upload, FlaskConical, Heart, FileText, Printer } from "lucide-react";

export function StorageControls() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const storageLabel = useActiveStorageLabel();
  const isApiStorage = storageLabel === "api";
  // Import, demo data and clearing would act on a folder that is not known right now.
  if (store.folderProblem) return null;

  const handleClearLocal = async () => {
    if (confirm(t("storage.clearConfirm"))) {
      await resetAmanahStore();
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

  // Export and backup in one place. Deleting account data has its own card in the settings; demo
  // data and resetting the browser copy exist only in the local demo mode.
  return (
    <div className="space-y-4" id="export-sicherung" data-testid="storage-controls">
      <p className="text-xs text-muted">{t("export.keepSafe")}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleReadableExport} data-testid="export-readable">
          <FileText size={14} className="mr-1" /> {t("export.readableBtn")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport} data-testid="export-backup">
          <Download size={14} className="mr-1" /> {t("storage.export")}
        </Button>
      </div>
      <details className="text-sm" data-testid="export-more">
        <summary className="cursor-pointer text-primary hover:underline w-fit">{t("storage.moreFormats")}</summary>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={handleEmergencyExport}>
            <Heart size={14} className="mr-1" /> {t("storage.emergencyExport")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleMarkdownExport}>
            {t("export.markdownBtn")}
          </Button>
          <Link href="/dashboard/pdf" className={linkButtonClassName({ size: "sm", variant: "outline" })}>
            <Printer size={14} className="mr-1" /> {t("storage.printPdf")}
          </Link>
        </div>
      </details>
      <div className="border-t border-border/60 pt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={14} className="mr-1" /> {t("storage.import")}
        </Button>
        {!isApiStorage && (
          <>
            <Button size="sm" variant="ghost" onClick={handleLoadDemo}>
              <FlaskConical size={14} className="mr-1" /> {t("storage.loadDemo")}
            </Button>
            <Button size="sm" variant="danger" onClick={handleClearLocal}>
              <Trash2 size={14} className="mr-1" /> {t("storage.resetLocal")}
            </Button>
          </>
        )}
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
