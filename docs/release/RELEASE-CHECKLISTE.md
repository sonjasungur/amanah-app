# Release-Checkliste (Stand 03.11.2026)

Ersetzt nicht die Freigaben in `freigaben.json`. Status: **erledigt**, **blockiert** (wartet auf Entscheidung oder Extern), **offen** (technisch, nach Freigabe).

| Punkt | Status | Nachweis |
|---|---|---|
| Registrierung nur mit bestätigter E-Mail | erledigt, Code | `release-core-flows`, Doku 44 |
| Echter Mailversand | **blockiert:** Anbieter, Domain, Testadresse | NOT_RUN |
| Datenverlust-Korrekturen | erledigt, im Kandidaten | `storage-sync`, `plus-tariff-account` |
| Hydrationsfehler | erledigt, im Kandidaten | `hydration-session` |
| Modultext-Sperre, alle Sprachen | erledigt | `module-text-lock`, `sprachabdeckung.md` |
| Wissenssperre, öffentliche Wege | erledigt | `public-content-probe.py`, `public-knowledge-anonymous` |
| Netztrennung | erledigt in Produktion; Proxy-Netz offen zum Release | Doku 41 §6, Doku 42 §3 |
| Image gepinnt, alter Build gesperrt | erledigt | Doku 41 §6 |
| Backups verschlüsselt, Restore isoliert geprüft | erledigt | Doku 45 §2 |
| Owner-Restore-Probe Produktions-Backup | **offen, Owner** | Doku 45 §2 |
| Betriebsprüfung automatisch | erledigt, ohne externen Alarm | Doku 45 §3 |
| Migrationsprobe 1 auf 6 | erledigt | `migration-rehearsal.sh`, Server-Probelauf |
| Staging auf Kandidat | erledigt | Doku 45 §4 |
| Mobile Profile | erledigt | iPhone-WebKit, Android |
| Smartphone-Abnahme echte Geräte | **NOT_RUN, blockiert:** Zugang, Geräte | Doku 43 |
| Datenschutz | **blockiert, extern** | `pruefpakete/datenschutz.md` |
| Recht | **blockiert, extern** | `pruefpakete/recht.md` |
| Religion | **blockiert, extern** | `pruefpakete/religion.md` |
| Medizin | **blockiert, extern** | `pruefpakete/medizin.md` |
| Nutzungsrechte | **blockiert, extern** | `pruefpakete/nutzungsrechte.md` |
| Marke, Domain | **blockiert, Owner** | `entscheidung-marke-domain-mail.md` |
| Plattenplatz | **offen:** 87 %, Warnung | Doku 45 §5 |
| Merge, Produktionsrelease, Migration | gesperrt | `produktionsplan.md` |
| Route, Registrierung | gesperrt | Doku 42, 44 |
