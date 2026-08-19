"use client";

import { useState } from "react";
import { StorageControls } from "@/components/storage/storage-controls";
import { AiConsentBanner } from "@/components/ai/ai-consent-banner";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resetAmanahStore } from "@/lib/store/use-amanah-store";
import { getActiveStorageLabel } from "@/lib/storage/storage-config";
import { getAuthToken } from "@/lib/auth/api-auth-provider";
import { isAiUiEnabled } from "@/lib/ai/config";
import { useI18n } from "@/lib/i18n/context";
import { HardDrive, Cloud, Trash2, Shield } from "lucide-react";

export default function EinstellungenPage() {
  const { t } = useI18n();
  const storageLabel = getActiveStorageLabel();
  const isApi = storageLabel === "api";
  const aiEnabled = isAiUiEnabled();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      if (isApi) {
        const token = getAuthToken();
        if (!token) {
          alert(t("storage.deleteServerNoAuth"));
          setIsDeleting(false);
          setConfirmDelete(false);
          return;
        }
        const res = await fetch("/api/amanah", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Fehler");
        await resetAmanahStore();
        alert(body.message || t("storage.deleteServerSuccess"));
      } else {
        await resetAmanahStore();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t("storage.deleteServerFailed"));
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-page-title font-bold text-foreground mb-2">Einstellungen</h1>
        <p className="text-body text-muted">Speicher, Datenschutz und KI-Einstellungen für dein Vorsorgedossier.</p>
      </div>

      <Card className="border-2 border-border/80 shadow-sm" data-testid="settings-storage-location">
        <div className="flex items-center gap-3 mb-3">
          {isApi ? <Cloud size={18} className="text-primary" aria-hidden /> : <HardDrive size={18} className="text-primary" aria-hidden />}
          <CardTitle className="text-card-title text-primary-dark">{t("settings.storageLocation.title")}</CardTitle>
        </div>
        <p className="text-sm text-muted">
          {isApi ? t("settings.storageLocation.api") : t("settings.storageLocation.local")}
        </p>
      </Card>

      <Card className="border-2 border-border/80 shadow-sm">
        <CardTitle className="text-card-title text-primary-dark mb-3">Daten & Export</CardTitle>
        <StorageControls />
      </Card>

      <Card className="border-2 border-border/80 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <Trash2 size={18} className="text-destructive mt-0.5 shrink-0" aria-hidden />
          <div>
            <CardTitle className="text-card-title text-primary-dark">{t("settings.deleteData.title")}</CardTitle>
            <p className="text-sm text-muted mt-1">{t("settings.deleteData.description")}</p>
          </div>
        </div>

        {confirmDelete && (
          <div
            className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            data-testid="settings-delete-data-confirm"
            role="alert"
          >
            {t("settings.deleteData.confirm")}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => void handleDeleteData()}
            disabled={isDeleting}
            data-testid="settings-delete-data-button"
          >
            <Trash2 size={14} className="mr-1.5" aria-hidden />
            {confirmDelete
              ? isDeleting
                ? "Wird gelöscht …"
                : "Ja, alle Vorsorgedaten löschen"
              : t("settings.deleteData.button")}
          </Button>
          {confirmDelete && !isDeleting && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Abbrechen
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-2 border-border/80 shadow-sm" data-testid="settings-ai-section">
        <div className="flex items-center gap-3 mb-3">
          <Shield size={18} className="text-primary" aria-hidden />
          <CardTitle className="text-card-title text-primary-dark">{t("settings.ai.title")}</CardTitle>
        </div>
        <div data-testid="settings-ai-consent-status">
          {!aiEnabled ? (
            <p className="text-sm text-muted">{t("settings.ai.disabled")}</p>
          ) : (
            <AiConsentBanner requiresExternal={false} />
          )}
        </div>
      </Card>
    </div>
  );
}
