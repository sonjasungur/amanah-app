"use client";

import { useState } from "react";
import { searchFuneralPartners } from "@/lib/mock/funeral-partners";
import type { FuneralPartner } from "@/lib/types";
import { Input, Label } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

function ServiceBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full ${
        active ? "bg-success/15 text-success" : "bg-sand text-muted line-through"
      }`}
    >
      {label}
    </span>
  );
}

function PartnerCard({ partner }: { partner: FuneralPartner }) {
  return (
    <Card className="hover:border-primary/25 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <CardTitle className="mb-1">{partner.name}</CardTitle>
          <p className="text-sm text-muted">
            {partner.city} · PLZ {partner.plzRange}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {partner.partner && (
            <span className="inline-flex items-center rounded-full bg-primary text-white px-3 py-1 text-xs font-medium">
              Amanah Vorsorge Partner
            </span>
          )}
          {partner.verified && (
            <span className="inline-flex items-center rounded-full bg-accent/20 text-accent px-3 py-1 text-xs font-medium">
              Verifiziert
            </span>
          )}
          {partner.available24_7 && (
            <span className="inline-flex items-center rounded-full bg-success/15 text-success px-3 py-1 text-xs font-medium">
              24/7 erreichbar
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <ServiceBadge active={partner.ghusl} label="Ghusl" />
        <ServiceBadge active={partner.kafan} label="Kafan" />
        <ServiceBadge active={partner.janazah} label="Janazah-Gebet" />
        <ServiceBadge active={partner.burialGermany} label="Beisetzung DE" />
        <ServiceBadge active={partner.repatriation} label="Überführung" />
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
        <div>
          <dt className="text-muted">Sprachen</dt>
          <dd className="font-medium text-foreground">{partner.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted">Preisspanne</dt>
          <dd className="font-medium text-foreground">{partner.priceRange}</dd>
        </div>
        <div>
          <dt className="text-muted">Telefon</dt>
          <dd>
            <a href={`tel:${partner.phone}`} className="font-medium text-primary-light underline">
              {partner.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Website</dt>
          <dd>
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-light underline break-all"
            >
              {partner.website.replace("https://", "")}
            </a>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export function BestatterDirectory() {
  const [query, setQuery] = useState("");
  const results = searchFuneralPartners(query);

  return (
    <>
      <div className="mb-8 rounded-2xl bg-sand/70 border border-primary/10 p-6">
        <Label htmlFor="bestatter-search">PLZ oder Stadt suchen</Label>
        <Input
          id="bestatter-search"
          type="search"
          placeholder="z. B. Berlin, 50xxx, Köln …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2"
        />
        <p className="text-xs text-muted mt-2">
          {results.length} {results.length === 1 ? "Eintrag" : "Einträge"} gefunden
        </p>
      </div>

      <div className="space-y-5">
        {results.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-sand/50 border border-primary/10">
            <p className="text-muted">Keine Bestatter für diese Suche gefunden.</p>
            <p className="text-sm text-muted mt-1">Versuche eine andere PLZ oder Stadt.</p>
          </div>
        ) : (
          results.map((partner) => <PartnerCard key={partner.id} partner={partner} />)
        )}
      </div>
    </>
  );
}
