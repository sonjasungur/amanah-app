import type { AIProvider, AIContext } from "./provider";
import type { AIMessage } from "@/lib/types";
import { searchKnowledge } from "@/lib/knowledge";
import { cultureFilterCards } from "@/lib/knowledge/kulturfilter";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import { getCriticalMissing } from "@/lib/utils/progress";
import type { AmanahOrdnerData } from "@/lib/types";

export class MockAIProvider implements AIProvider {
  async chat(messages: AIMessage[], context?: AIContext): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

    if (context?.task === "family_letter" || lastMessage.includes("familienbrief") || lastMessage.includes("familie")) {
      return this.generateFamilyLetter(lastMessage, context?.targetLanguage);
    }

    if (context?.task === "summary" || lastMessage.includes("zusammenfassung")) {
      return this.generateSummary(context?.amanahData as AmanahOrdnerData);
    }

    if (context?.task === "open_points" || lastMessage.includes("offene punkte") || lastMessage.includes("fehlt")) {
      return this.generateOpenPoints(context?.amanahData as AmanahOrdnerData);
    }

    if (context?.task === "translate" || lastMessage.includes("übersetz")) {
      return this.generateTranslation(messages[messages.length - 1]?.content || "", context?.targetLanguage || "tr");
    }

    if (context?.task === "culture" || lastMessage.includes("kultur")) {
      return this.answerCulture(lastMessage);
    }

    if (context?.task === "testament" || lastMessage.includes("erbe") || lastMessage.includes("wasiyyah") || lastMessage.includes("fara")) {
      return this.answerTestament(lastMessage);
    }

    if (lastMessage.includes("anfangen") || lastMessage.includes("start") || lastMessage.includes("womit")) {
      return this.generateGuide();
    }

    const knowledgeResults = searchKnowledge(lastMessage);
    if (knowledgeResults.length > 0) {
      return this.answerFromKnowledge(knowledgeResults[0].title, knowledgeResults[0].content, knowledgeResults[0].sourceIds, knowledgeResults[0].reviewStatus);
    }

    return this.generateGuide();
  }

  private generateGuide(): string {
    return `**Amanah-Assistent — Wegweiser**

Ich helfe dir, deinen AmanahOrdner Schritt für Schritt vorzubereiten. Hier sind deine nächsten 3 Schritte:

1. **Notfallkarte ausfüllen** — Name, Notfallkontakt und wichtige medizinische Infos
2. **Janazah-Wünsche dokumentieren** — Bestatter, Moschee und Bestattungswünsche festhalten
3. **Schulden & Amanah ordnen** — Offene Rechte und Pflichten aufschreiben

> *Hinweis: Ich ersetze keinen Imam, Arzt, Anwalt oder Notar. Bei islamischen Fragen nutze ich nur geprüfte Wissensinhalte.*

Möchtest du mit einem dieser Module beginnen?`;
  }

  private generateFamilyLetter(input: string, lang?: string): string {
    const langNote = lang ? `\n\n*(Übersetzung in ${lang} als nächster Schritt möglich)*` : "";
    return `**Entwurf — Familienbrief**

Liebe Familie,

ich möchte euch mitteilen, dass mir eine würdevolle islamische Bestattung wichtig ist. Bitte prüft eine zeitnahe Beisetzung in Deutschland und kontaktiert den von mir benannten Bestatter und unsere Moschee.

Ich wünsche mir keine aufwendigen kulturellen Trauerfeiern (7., 40., 52. Tag), die finanziell belastend sind. Stattdessen bitte ich euch um Dua und einfache Sadaqa Jariya.

Meine detaillierten Wünsche findet ihr in meinem AmanahOrdner.

In Liebe und Vertrauen,
[Dein Name]

> *Dies ist ein Entwurf. Bitte Imam/Gelehrte und Familie einbeziehen. Keine Rechtsberatung.*${langNote}`;
  }

  private generateSummary(data?: AmanahOrdnerData): string {
    if (!data) return "Bitte fülle zuerst deine Module aus, damit ich eine Zusammenfassung erstellen kann.";

    return `**Meine wichtigsten Wünsche — Zusammenfassung**

**Notfall:** ${data.emergencyCard.name || "—"} | Kontakt: ${data.emergencyCard.emergencyContact1.name || "—"}
**Janazah:** ${data.janazahWishes.islamicBurialDesired ? "Islamische Bestattung gewünscht" : "Noch nicht festgelegt"}
**Bestatter:** ${data.janazahWishes.preferredFuneralDirector || "—"}
**Vorsorgevollmacht:** ${data.powerOfAttorney.authorizedPerson || "—"}
**Schulden/Amanah:** ${data.debtsAmanah.length} Einträge

**Offene Fragen an Imam:** ${data.inheritanceProfile.openQuestionsImam || data.medicalWishes.openQuestionsImam || "—"}
**Offene Fragen an Anwalt/Notar:** ${data.inheritanceProfile.openQuestionsLawyer || "—"}

> *Zusammenfassung basiert auf deinen Eingaben. Keine Garantie für Vollständigkeit.*`;
  }

  private generateOpenPoints(data?: AmanahOrdnerData): string {
    if (!data) return "Keine Daten vorhanden. Bitte beginne mit der Notfallkarte.";

    const missing = getCriticalMissing(data);
    const extra: string[] = [];

    if (data.sadaqaJariya.joinFoerderkreis && !data.sadaqaJariya.personToVerify) {
      extra.push("Du hast Sadaqa Jariya gewählt, aber keine Vertrauensperson benannt.");
    }
    if (data.janazahWishes.repatriation === "yes" && !data.burialPreference.familyNote) {
      extra.push("Du hast Überführung ausgewählt, aber keinen Familienhinweis ergänzt.");
    }

    const all = [...missing.map((m) => `• Dir fehlt noch: **${m}**`), ...extra.map((e) => `• ${e}`)];
    return `**Offene Punkte**\n\n${all.join("\n") || "Alle kritischen Felder sind ausgefüllt. Prüfe dennoch jeden Bereich mit Fachleuten."}`;
  }

  private generateTranslation(text: string, targetLang: string): string {
    return `**Übersetzung** (Mock — ${targetLang})

Original (DE):
${text}

---
*Im MVP liefert der Mock-Provider eine Platzhalter-Übersetzung. Mit OPENAI_API_KEY wird echte Übersetzung aktiviert.*

> Hinweis: Für verbindliche Dokumente bitte professionelle Übersetzung oder Imam/Gelehrte konsultieren.`;
  }

  private answerCulture(query: string): string {
    const card = cultureFilterCards.find(
      (c) => c.question.toLowerCase().includes(query.slice(0, 20)) || query.includes(c.id.replace("kultur-", ""))
    ) || cultureFilterCards[0];

    const sources = getSourcesByIds(card.sourceIds);
    return `**Kulturfilter: ${card.question}**

**Kurze Antwort:** Unterscheide zwischen islamischer Grundlage und kultureller Gewohnheit.

**Islamische Grundlage:**
${card.islamicBasis}

**Kulturelle Praxis:**
${card.culturalPractice}

**Was solltest du prüfen?**
${card.whatToCheck}

${card.opinionDifferences ? `**Meinungsunterschiede:** ${card.opinionDifferences}` : ""}

**Quellen:**
${sources.map((s) => `• ${s.reference}: ${s.title}`).join("\n")}

> Imam/Gelehrte fragen bei Detailfragen.`;
  }

  private answerTestament(_query: string): string {
    return `**Testament-Hilfe**

**Kurze Antwort:** Im Islam sind feste Erbanteile (Farāʾiḍ) gesetzt. Du kannst bis zu 1/3 frei verfügen (Waṣiyya).

**Islamische Grundlage:**
- Qur'an: Sura an-Nisāʾ 4:11–12 — feste Erbanteile
- Hadith: „Ein Drittel, und ein Drittel ist viel." — Waṣiyya-Begrenzung

**Gibt es Meinungsunterschiede?**
Ja, bei komplexen Konstellationen (Stiefkinder, Ausland, GmbH).

**Was solltest du tun?**
1. Ampelcheck im Testament-Modul nutzen
2. Imam/Gelehrte für islamisches Erbrecht fragen
3. Anwalt/Notar für deutsches Erbrecht und Formvorschriften

> Keine verbindliche Erbanteilberechnung. Keine Fatwa.`;
  }

  private answerFromKnowledge(title: string, content: string, sourceIds: string[], reviewStatus: string): string {
    const sources = getSourcesByIds(sourceIds);
    const reviewNote = reviewStatus === "needs_scholar_review" ? "\n\n⚠️ *Einige Quellen sind in fachlicher Prüfung.*" : "";

    return `**${title}**

**Kurze Antwort:**
${content}

**Islamische Grundlage / Quellen:**
${sources.map((s) => `• ${s.reference}: ${s.translationDe || s.title}`).join("\n")}

**Gibt es Meinungsunterschiede?**
Bei Detailfragen ja — bitte Imam/Gelehrte fragen.

**Was solltest du praktisch tun?**
Dokumentiere deine Wünsche im passenden Modul und konsultiere Fachleute.

> Imam/Gelehrte fragen. Keine Fatwa.${reviewNote}`;
  }
}
