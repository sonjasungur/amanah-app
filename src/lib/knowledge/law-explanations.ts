/**
 * One plain sentence per cited norm: "what is this about?" (owner acceptance 27.11.2026: the bare titles under an
 * article said too little). Editorial summaries, not legal advice; the linked official text stays authoritative.
 * Not yet reviewed by a law firm (AP21 R1 holds the detailed rules with sources).
 */

const BGB: Record<number, string> = {
  80: "Eine rechtsfähige Stiftung entsteht durch das Stiftungsgeschäft und die Anerkennung der zuständigen Behörde.",
  1363: "Ohne Ehevertrag leben Ehegatten in Zugewinngemeinschaft; ihre Vermögen bleiben dabei getrennt.",
  1638: "Wer einem Kind etwas vererbt, kann bestimmen, dass die Eltern – etwa ein geschiedener Elternteil – dieses Vermögen nicht verwalten.",
  1773: "Ein Kind bekommt einen Vormund, wenn kein Elternteil die Sorge hat; das Familiengericht bestellt ihn.",
  1783: "Das Gericht darf die von den Eltern benannte Person nur aus bestimmten Gründen übergehen, etwa wenn das Kindeswohl es verlangt.",
  1828: "Arzt und Vertreter besprechen gemeinsam, was der Patient will und ob eine Patientenverfügung zutrifft; nahe Angehörige sollen angehört werden.",
  1942: "Die Erbschaft geht mit dem Tod auf den Erben über; er kann sie ausschlagen.",
  2058: "Mehrere Erben haften für die Nachlassschulden gemeinsam als Gesamtschuldner.",
  125: "Hält ein Rechtsgeschäft die vorgeschriebene Form nicht ein, ist es nichtig – etwa ein Testament, das nicht von Hand geschrieben ist.",
  1358: "Ehegatten dürfen sich in Gesundheitsfragen bis zu sechs Monate gegenseitig vertreten, wenn einer nicht selbst entscheiden kann.",
  1371: "Bei Zugewinngemeinschaft erhöht sich der gesetzliche Erbteil des Ehegatten um ein Viertel; wer ausschlägt oder enterbt ist, kann stattdessen den Zugewinnausgleich verlangen.",
  1777: "Das Familiengericht kann Angelegenheiten der elterlichen Sorge auf eine Pflegeperson als Pfleger übertragen.",
  1782: "Eltern können im Testament bestimmen, wer Vormund ihrer minderjährigen Kinder werden soll – oder wer nicht.",
  1814: "Ein rechtlicher Betreuer wird nur bestellt, wenn jemand seine Angelegenheiten nicht selbst regeln kann und keine Vollmacht ausreicht.",
  1816: "Wer Betreuer wird; die Wünsche der betroffenen Person, etwa aus einer Betreuungsverfügung, sind zu beachten.",
  1820: "Eine Vorsorgevollmacht geht einer gerichtlichen Betreuung vor; geregelt sind auch Kontrolle und Grenzen der Vollmacht.",
  1827: "Eine schriftliche Patientenverfügung bindet Ärzte und Vertreter, wenn sie auf die konkrete Behandlungssituation zutrifft.",
  1922: "Mit dem Tod geht das gesamte Vermögen samt Schulden auf den oder die Erben über.",
  1924: "Kinder erben als erste Ordnung zu gleichen Teilen; an die Stelle eines verstorbenen Kindes treten dessen Kinder.",
  1925: "Gibt es keine Kinder, erben die Eltern und an ihrer Stelle deren Abkömmlinge, also Geschwister.",
  1926: "Erst danach erben Großeltern und deren Abkömmlinge, etwa Onkel, Tanten, Cousins.",
  1928: "Danach erben Urgroßeltern und deren Abkömmlinge.",
  1929: "Noch entferntere Vorfahren und ihre Abkömmlinge bilden die weiteren Ordnungen.",
  1930: "Solange ein Verwandter einer näheren Ordnung lebt, erben entferntere Verwandte nicht.",
  1931: "Wie viel der Ehegatte gesetzlich erbt, hängt davon ab, wer daneben erbt – neben Kindern etwa ein Viertel (vor dem Zugewinn-Ausgleich).",
  1936: "Gibt es weder Ehegatten noch Verwandte, erbt der Staat.",
  1937: "Durch Testament bestimmt man selbst, wer Erbe wird.",
  1938: "Man kann einen gesetzlichen Erben ausschließen, ohne jemand anderen einzusetzen.",
  1939: "Man kann jemandem einen bestimmten Gegenstand oder Betrag zuwenden, ohne ihn zum Erben zu machen (Vermächtnis).",
  1944: "Eine Erbschaft kann man in der Regel nur innerhalb von sechs Wochen ausschlagen, bei Auslandsbezug innerhalb von sechs Monaten.",
  1967: "Der Erbe haftet für die Schulden des Verstorbenen.",
  1968: "Der Erbe trägt die Kosten einer angemessenen Beerdigung.",
  1975: "Durch Nachlassverwaltung oder Nachlassinsolvenz lässt sich die Haftung des Erben auf den Nachlass beschränken.",
  2032: "Mehrere Erben bilden eine Erbengemeinschaft; der Nachlass gehört ihnen gemeinsam.",
  2033: "Ein Miterbe kann über seinen Anteil am Nachlass verfügen, nicht über einzelne Gegenstände daraus.",
  2038: "Die Erben verwalten den Nachlass gemeinsam.",
  2042: "Jeder Miterbe kann grundsätzlich verlangen, dass der Nachlass aufgeteilt wird.",
  2064: "Ein Testament kann nur persönlich errichtet werden, nicht durch einen Vertreter.",
  2065: "Wer erbt, darf man nicht der Entscheidung eines anderen überlassen.",
  2147: "Bestimmt, wer ein Vermächtnis erfüllen muss – in der Regel die Erben.",
  2174: "Das Vermächtnis gibt dem Bedachten einen Anspruch gegen den Verpflichteten; der Gegenstand geht nicht von selbst über.",
  2229: "Ab 16 Jahren kann man ein Testament errichten, Minderjährige nur vor dem Notar; wer die Bedeutung nicht erfassen kann, kann keines errichten.",
  2231: "Ein Testament kann man vor einem Notar oder eigenhändig errichten.",
  2232: "Das notarielle Testament: Erklärung gegenüber dem Notar oder Übergabe einer Schrift.",
  2247: "Ein eigenhändiges Testament muss vollständig von Hand geschrieben und unterschrieben sein.",
  2248: "Ein eigenhändiges Testament kann man beim Amtsgericht in amtliche Verwahrung geben.",
  2253: "Ein Testament kann man jederzeit widerrufen.",
  2254: "Widerruf durch ein neues Testament.",
  2255: "Widerruf, indem man die Urkunde in dieser Absicht vernichtet oder verändert.",
  2256: "Ein notarielles Testament gilt als widerrufen, wenn man es aus der amtlichen Verwahrung zurücknimmt.",
  2258: "Ein späteres Testament hebt ein früheres auf, soweit es ihm widerspricht.",
  2259: "Wer ein Testament findet, muss es beim Nachlassgericht abliefern.",
  2265: "Ein gemeinschaftliches Testament können nur Ehegatten errichten.",
  2267: "Beim gemeinschaftlichen eigenhändigen Testament genügt es, wenn einer es schreibt und beide unterschreiben.",
  2269: "Ehegatten setzen sich gegenseitig ein und bestimmen, wer nach dem Längerlebenden erbt („Berliner Testament“).",
  2270: "Verfügungen der Ehegatten, die voneinander abhängen, binden beide (wechselbezüglich).",
  2271: "Wechselbezügliche Verfügungen lassen sich nur eingeschränkt widerrufen, nach dem Tod eines Ehegatten grundsätzlich nicht mehr.",
  2274: "Einen Erbvertrag kann man nur persönlich schließen.",
  2276: "Ein Erbvertrag muss vor einem Notar geschlossen werden.",
  2303: "Kinder, Ehegatte und – ohne Kinder – Eltern können als Pflichtteil die Hälfte ihres gesetzlichen Erbteils in Geld verlangen, wenn sie enterbt sind.",
  2305: "Wem weniger als die Hälfte seines gesetzlichen Erbteils zugedacht ist, kann den fehlenden Wert verlangen.",
  2306: "Ist ein pflichtteilsberechtigter Erbe mit Auflagen oder Vermächtnissen belastet, kann er ausschlagen und den Pflichtteil verlangen.",
  2317: "Der Pflichtteilsanspruch entsteht mit dem Erbfall; er ist vererblich und übertragbar.",
  2346: "Man kann vertraglich auf sein Erbrecht oder nur auf den Pflichtteil verzichten.",
  2348: "Ein Erbverzicht muss notariell beurkundet werden.",
  2353: "Der Erbschein weist nach, wer Erbe ist; ihn erteilt das Nachlassgericht.",
};

const OTHER: { match: RegExp; text: string }[] = [
  { match: /§\s*28\s+PStG/i, text: "Ein Sterbefall muss dem Standesamt angezeigt werden, spätestens am dritten Werktag danach." },
  { match: /§\s*29\s+PStG/i, text: "Wer den Sterbefall anzeigen muss – zum Beispiel Angehörige oder Mitbewohner." },
  { match: /§\s*30\s+PStG/i, text: "Stirbt jemand im Krankenhaus, Heim oder einer ähnlichen Einrichtung, zeigt die Einrichtung den Sterbefall an." },
  { match: /§\s*34a\s+Beurkundungsgesetz|§\s*34a\s+BeurkG/i, text: "Der Notar meldet Testamente an das Zentrale Testamentsregister und gibt sie in amtliche Verwahrung." },
  { match: /§\s*347\s+FamFG/i, text: "Verwahrte Testamente werden an das Zentrale Testamentsregister gemeldet, damit sie im Todesfall gefunden werden." },
  { match: /§\s*348\s+FamFG/i, text: "Nach dem Tod eröffnet das Nachlassgericht die Testamente und informiert die Beteiligten." },
  { match: /§\s*35\s+Grundbuchordnung|§\s*35\s+GBO/i, text: "Wie Erben dem Grundbuchamt die Erbfolge nachweisen – mit Erbschein oder notariellem Testament samt Eröffnungsprotokoll." },
  { match: /§\s*13\b.*ErbStG/i, text: "Zuwendungen an steuerbegünstigte, etwa gemeinnützige oder mildtätige Körperschaften können von der Erbschaftsteuer befreit sein." },
  { match: /Bestattung|Leichen|Friedhof/i, text: "Landesrecht: regelt unter anderem Leichenschau, Fristen, Sarg- oder Tuchbestattung und Friedhöfe in diesem Bundesland – Einzelheiten unterscheiden sich je Land." },
];

const EU_ARTICLES: Record<number, string> = {
  21: "Grundsätzlich gilt das Erbrecht des Staates, in dem man zuletzt gewöhnlich gelebt hat.",
  22: "Man kann stattdessen das Recht seiner Staatsangehörigkeit wählen.",
  23: "Das gewählte oder geltende Recht regelt den ganzen Erbfall: Erben, Anteile, Pflichtteil, Haftung.",
  27: "Ein Testament ist formgültig, wenn es die Form eines von mehreren verbundenen Rechten einhält.",
  30: "Sonderregeln einzelner Staaten für bestimmte Vermögenswerte, etwa Immobilien, bleiben anwendbar.",
  34: "Verweist das Recht eines Nicht-EU-Staats weiter, kann ein anderes Recht gelten.",
  35: "Ausländisches Recht wird nicht angewendet, soweit es mit Grundwerten des deutschen Rechts offensichtlich unvereinbar ist.",
  62: "Das Europäische Nachlasszeugnis weist Erben in anderen EU-Staaten aus.",
  75: "Ältere Abkommen, etwa mit der Türkei oder Iran, gehen vor.",
  83: "Gilt für Erbfälle ab dem 17. August 2015; frühere Rechtswahlen bleiben unter Umständen wirksam.",
  84: "Inkrafttreten der Verordnung.",
};

/** "Worum es geht" for a cited law source, or null if no summary is on file. */
export function explainLaw(title: string): string | null {
  const bgb = title.match(/§\s*(\d+)\s*(?:Abs\.[^B]*)?BGB/);
  if (bgb && BGB[Number(bgb[1])]) return BGB[Number(bgb[1])];
  if (/650\/2012|EuErbVO|Erbrechtsverordnung/.test(title)) {
    const arts = [...title.matchAll(/Art\.\s*(\d+)/g)].map((m) => Number(m[1]));
    const parts = [...new Set(arts)].map((a) => EU_ARTICLES[a]).filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  }
  return OTHER.find((o) => o.match.test(title))?.text ?? null;
}

/** Short label for the list: "§ 2247 BGB – Eigenhändiges Testament" stays; long state-law titles are cut at the date. */
export function shortLawTitle(title: string): string {
  const cut = title.match(/^(.*?)\s+vom\s+\d/);
  return cut ? cut[1] : title;
}
