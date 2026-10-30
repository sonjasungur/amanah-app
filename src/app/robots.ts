import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/kasse/", "/intern/", "/wissen/redaktion", "/konto/", "/passwort-vergessen", "/passwort-zuruecksetzen", "/login", "/register"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
