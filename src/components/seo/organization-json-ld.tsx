import { BRAND } from "@/lib/brand";
import { IMPRINT } from "@/lib/legal/imprint";
import { getSiteUrl } from "@/lib/seo/site-url";

/**
 * Schema.org data for the start page (owner order 25.11.2026, AP4): who operates Wasiyya and how to
 * reach them — only facts from the imprint, no ratings, no reviewers, no claims.
 */
export function organizationJsonLd(site: string = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organisation`,
        name: IMPRINT.operatorLegalName,
        brand: { "@type": "Brand", name: BRAND.name },
        url: site,
        logo: `${site}/icon-512.png`,
        email: IMPRINT.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: IMPRINT.street,
          postalCode: IMPRINT.city.split(" ")[0],
          addressLocality: IMPRINT.city.split(" ").slice(1).join(" "),
          addressCountry: "DE",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        name: BRAND.name,
        alternateName: BRAND.fullName,
        url: site,
        inLanguage: "de-DE",
        publisher: { "@id": `${site}/#organisation` },
      },
    ],
  };
}

/** `<` is escaped so the data can never close the script element. */
export function OrganizationJsonLd() {
  const json = JSON.stringify(organizationJsonLd()).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
