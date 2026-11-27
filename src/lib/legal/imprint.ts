export const IMPRINT = {
  productName: "Wasiyya",
  operatorLegalName: "MSC Engineering GmbH",
  street: "Karlstraße 14",
  city: "74336 Brackenheim",
  country: "Deutschland",
  // Owner 25.11.2026: aliases of the Zoho mailbox on wasiyya.de
  email: "kontakt@wasiyya.de",
  privacyEmail: "datenschutz@wasiyya.de",
  representedBy: "Geschäftsführerin Sonja Sungur",
  registerCourt: "Amtsgericht Stuttgart",
  commercialRegisterNumber: "HRB 738249",
  // Owner decision 27.11.2026 (AP22, EA-02.2): no "inhaltlich Verantwortliche nach § 18 Abs. 2 MStV" for now. That
  // statement is only required for journalistic-editorial offers; the knowledge centre is not public yet. Open question
  // to the law firm: I2 (is a § 18 Abs. 2 MStV statement needed once the knowledge centre is published, and who is named?).
  // The managing director's name stays only in `representedBy` (§ 5 Abs. 1 Nr. 1 DDG) and nowhere else (EA-02.3, test).
  isPlaceholder: false,
} as const;
