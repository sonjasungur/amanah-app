/**
 * AP22 EA-01.3: the shared help module (ⓘ) for form fields. These types are safe for client code;
 * the texts themselves stay on the server (lib/help/registry.ts) and reach the browser only through
 * /api/help/[id], so unreviewed religious texts are never part of the client bundle.
 */

export const FIELD_HELP_IDS = ["ghusl-waschung", "ghusl-anwesende", "ghusl-wuerde"] as const;
export type FieldHelpId = (typeof FIELD_HELP_IDS)[number];

/** "ungeprueft" until a documented specialist review; shown on every help box. */
export type FieldHelpReview = "ungeprueft" | "geprueft";

export interface FieldHelpSource {
  text: string;
  /** Only https links or internal paths. */
  href?: string;
}

/** One help text, as stored on the server (and later read from recherche/hilfetexte-*.json). */
export interface FieldHelpEntry {
  id: string;
  /** The term, plainly explained. */
  begriff: string;
  /** Islamic guidance, as far as the sources say. */
  vorgabe?: string;
  /** Differing views of scholars or schools. */
  auffassungen?: string;
  /** Where there is room for own decisions. */
  spielraum?: string;
  /** "Was du entscheidest": what the person decides in this field. */
  entscheidung?: string;
  quellen: FieldHelpSource[];
  /** Knowledge-centre article (/wissen/zentrum/artikel/[slug]); linked only when the article is reachable. */
  artikelSlug?: string;
  pruefstatus: FieldHelpReview;
  /** Where the text comes from (file), so it can be replaced by the research later. */
  herkunft: string;
}

/** What the browser gets. Without review and outside the preview, only neutral parts are sent. */
export interface FieldHelpView {
  id: string;
  begriff: string;
  entscheidung?: string;
  vorgabe?: string;
  auffassungen?: string;
  spielraum?: string;
  quellen: FieldHelpSource[];
  artikelHref?: string;
  pruefstatus: FieldHelpReview;
  /** True when the religious parts are withheld until review. */
  restricted: boolean;
}

export const REVIEW_LABEL: Record<FieldHelpReview, string> = {
  ungeprueft: "Noch nicht fachlich geprüft",
  geprueft: "Fachlich geprüft",
};

export function isFieldHelpId(id: string): id is FieldHelpId {
  return (FIELD_HELP_IDS as readonly string[]).includes(id);
}
