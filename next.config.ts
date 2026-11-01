import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy without nonces (keeps pages static). Scripts, connections and
 * forms are limited to this origin, so even an XSS cannot load foreign code or send data
 * to foreign servers. Inline scripts are still needed for the Next.js bootstrap.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Baseline headers for every response. Caddy sets HSTS in production. */
const securityHeaders = [
  ...(process.env.NEXT_PUBLIC_AMANAH_ENVIRONMENT === "staging" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** Separate output for the e2e run with development flags, so it can never replace a normal build. */
const ISOLATED_DIST_DIR = ".next-e2e-flags";
const isolatedDistDir = process.env.AMANAH_E2E_DIST_DIR;
if (isolatedDistDir && isolatedDistDir !== ISOLATED_DIST_DIR) {
  throw new Error(`AMANAH_E2E_DIST_DIR may only be ${ISOLATED_DIST_DIR}.`);
}

/**
 * These flags stay off on staging and in production until the owner lifts the lock. NEXT_PUBLIC_
 * values are fixed at build time, so a build that turns one on outside the isolated run fails here.
 */
const LOCKED_FLAGS = ["NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION", "NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS"];
if (!isDev && !isolatedDistDir) {
  const enabled = LOCKED_FLAGS.filter((flag) => process.env[flag] === "true");
  if (enabled.length) throw new Error(`Locked feature flags are on outside the isolated e2e build: ${enabled.join(", ")}`);
}

const nextConfig: NextConfig = {
  output: "standalone",
  ...(isolatedDistDir ? { distDir: isolatedDistDir } : {}),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
