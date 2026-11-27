/**
 * AP22 EA-17.1: optional example sentences for the family letter, per recipient and topic. The
 * person takes a sentence with one click and changes it freely. Plain, warm wording of our own;
 * no Qurʾān or Hadith quotations, and the Duʿāʾ examples are general requests without a source claim.
 * The letter is personal words, never a will.
 */

export type LetterRecipient = "ehefrau" | "ehemann" | "kinder" | "eltern" | "geschwister" | "andere";
export type LetterTopic = "abschied" | "vergebung" | "dua" | "zusammenhalt" | "wuensche";

export const LETTER_RECIPIENTS: readonly { id: LetterRecipient; label: string }[] = [
  { id: "ehefrau", label: "Ehefrau" },
  { id: "ehemann", label: "Ehemann" },
  { id: "kinder", label: "Kinder" },
  { id: "eltern", label: "Eltern" },
  { id: "geschwister", label: "Geschwister" },
  { id: "andere", label: "Andere" },
];

export const LETTER_TOPICS: readonly { id: LetterTopic; label: string }[] = [
  { id: "abschied", label: "Abschied" },
  { id: "vergebung", label: "Bitte um Vergebung" },
  { id: "dua", label: "Duʿāʾ" },
  { id: "zusammenhalt", label: "Zusammenhalt" },
  { id: "wuensche", label: "Persönliche Wünsche" },
];

export const LETTER_PHRASES_NOTICE = "Kein Testament – rechtlich bindende Verfügungen gehören ins Testament.";

export const LETTER_PHRASES: Record<LetterRecipient, Record<LetterTopic, readonly string[]>> = {
  ehefrau: {
    abschied: [
      "Meine liebe Frau, danke für jeden Tag, den wir miteinander geteilt haben. Du warst mein Halt und meine Ruhe.",
      "Wenn du diesen Brief liest, bin ich nicht mehr bei dir. Ich habe dich geliebt, an guten und an schweren Tagen.",
    ],
    vergebung: [
      "Verzeih mir, wenn ich dich verletzt habe, mit Worten oder durch das, was ich versäumt habe.",
      "Ich bitte dich um Vergebung für meine Ungeduld. Ich habe dir längst alles vergeben.",
    ],
    dua: [
      "Ich bitte Allah, dir Geduld und Trost zu schenken und uns im Paradies wieder zusammenzuführen.",
      "Bitte denk in deinen Gebeten an mich, so wie ich in meinen an dich gedacht habe.",
    ],
    zusammenhalt: [
      "Bitte bleib mit unserer Familie verbunden und lass dir helfen. Du musst nicht alles allein tragen.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass du wieder Freude findest und gut für dich sorgst.",
    ],
  },
  ehemann: {
    abschied: [
      "Mein lieber Mann, danke für deine Liebe, deine Fürsorge und jeden gemeinsamen Tag.",
      "Wenn du diesen Brief liest, bin ich nicht mehr bei dir. Ich war glücklich an deiner Seite.",
    ],
    vergebung: [
      "Verzeih mir, wenn ich dich verletzt habe, mit Worten oder durch das, was ich versäumt habe.",
      "Ich bitte dich um Vergebung für alles, was zwischen uns schwer war. Ich habe dir längst vergeben.",
    ],
    dua: [
      "Ich bitte Allah, dir Kraft und Trost zu schenken und uns im Paradies wieder zusammenzuführen.",
      "Bitte denk in deinen Gebeten an mich, so wie ich in meinen an dich gedacht habe.",
    ],
    zusammenhalt: [
      "Bitte halte unsere Familie zusammen und nimm Hilfe an, wenn sie dir angeboten wird.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass du gut für dich sorgst und wieder Ruhe findest.",
    ],
  },
  kinder: {
    abschied: [
      "Meine lieben Kinder, ihr wart mein größtes Geschenk. Ich bin so dankbar für jeden Tag mit euch.",
      "Ich bin stolz auf euch, so wie ihr seid. Vergesst nie, wie sehr ich euch liebe.",
    ],
    vergebung: [
      "Verzeiht mir, wenn ich zu streng war oder zu wenig Zeit für euch hatte.",
      "Wenn ich euch Unrecht getan habe, bitte ich euch um Vergebung.",
    ],
    dua: [
      "Ich bitte Allah, euch zu behüten, euch auf einem guten Weg zu führen und euch Frieden im Herzen zu schenken.",
      "Bitte vergesst mich nicht in euren Bittgebeten.",
    ],
    zusammenhalt: [
      "Haltet zusammen und seid füreinander da, auch wenn ihr verschiedener Meinung seid.",
      "Bitte kümmert euch umeinander und um alle, die mich vermissen.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass ihr am Gebet festhaltet und gut zu anderen Menschen seid.",
      "Lernt weiter, bleibt neugierig und geht euren Weg mit Zuversicht.",
    ],
  },
  eltern: {
    abschied: [
      "Liebe Mama, lieber Papa, danke für alles, was ihr mir gegeben habt. Ohne euch wäre ich nicht der Mensch, der ich bin.",
    ],
    vergebung: [
      "Verzeiht mir, wenn ich euch Sorgen gemacht oder euch nicht genug geehrt habe.",
    ],
    dua: [
      "Ich bitte Allah, euch Geduld und Trost zu schenken und euch für eure Liebe zu belohnen.",
      "Bitte denkt in euren Gebeten an mich.",
    ],
    zusammenhalt: [
      "Bitte bleibt mit der ganzen Familie eng verbunden und lasst euch von ihr stützen.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass ihr nicht verzweifelt, sondern euch an die schönen Zeiten erinnert.",
    ],
  },
  geschwister: {
    abschied: [
      "Meine lieben Geschwister, danke für unsere gemeinsame Kindheit und dafür, dass ihr immer da wart.",
    ],
    vergebung: [
      "Wenn es zwischen uns Streit oder Kränkungen gab, bitte ich euch um Vergebung. Ich habe euch vergeben.",
    ],
    dua: [
      "Ich bitte Allah, euch zu behüten und eure Familien zu segnen.",
      "Bitte vergesst mich nicht in euren Bittgebeten.",
    ],
    zusammenhalt: [
      "Bitte haltet zusammen und kümmert euch umeinander und um unsere Eltern.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass ihr offen miteinander sprecht und alten Streit ruhen lasst.",
    ],
  },
  andere: {
    abschied: [
      "Danke für eure Freundschaft und alles, was ihr mit mir geteilt habt.",
    ],
    vergebung: [
      "Wenn ich jemandem von euch Unrecht getan habe, bitte ich um Vergebung.",
    ],
    dua: [
      "Ich bitte Allah, euch Gutes zu schenken. Bitte denkt in euren Gebeten an mich.",
    ],
    zusammenhalt: [
      "Bitte steht meiner Familie in der ersten Zeit bei.",
    ],
    wuensche: [
      "Mein Wunsch ist, dass ihr mich in guter Erinnerung behaltet.",
    ],
  },
};

/** Adds a sentence as its own paragraph at the end. The existing text is never replaced. */
export function appendPhrase(body: string, phrase: string): string {
  const trimmed = body.replace(/\s+$/, "");
  return trimmed ? `${trimmed}\n\n${phrase}` : phrase;
}
