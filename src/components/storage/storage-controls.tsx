"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { exportToJson, importFromJson } from "@/lib/storage/amanah-store";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useRef } from "react";
import { Save, Trash2, Download, Upload } from "lucide-react";

export function StorageControls() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    useAmanahStore.persist.rehydrate();
    alert("Lokal gespeichert!");
  };

  const handleClear = () => {
    if (confirm("Alle lokalen Daten wirklich löschen?")) {
      store.reset();
      localStorage.removeItem("amanah-ordner-data");
    }
  };

  const handleExport = () => {
    exportToJson(store as unknown as Parameters<typeof exportToJson>[0]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJson(file);
      store.importData(data);
      alert("Import erfolgreich!");
    } catch {
      alert("Import fehlgeschlagen.");
    }
  };

  return (
    <div className="rounded-2xl bg-sand border border-primary/10 p-4 space-y-3">
      <p className="text-sm text-muted flex items-center gap-2">
        <Save size={16} />
        {t("storage.notice")}
      </p>
      {store.lastSaved && (
        <p className="text-xs text-muted">Zuletzt gespeichert: {new Date(store.lastSaved).toLocaleString("de-DE")}</p>
      )}
      <p className="text-xs text-warning">{t("storage.warning")}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleSave}>
          <Save size={14} className="mr-1" /> {t("storage.save")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download size={14} className="mr-1" /> {t("storage.export")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload size={14} className="mr-1" /> {t("storage.import")}
        </Button>
        <Button size="sm" variant="danger" onClick={handleClear}>
          <Trash2 size={14} className="mr-1" /> {t("storage.clear")}
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
