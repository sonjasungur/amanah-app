import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { isStagingBuild } from "@/lib/deployment-env";

export default function robots(): MetadataRoute.Robots {
  if (isStagingBuild()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/kasse/", "/intern/", "/wissen/redaktion", "/konto/", "/passwort-vergessen", "/passwort-zuruecksetzen", "/login", "/register"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
