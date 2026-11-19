/**
 * Deployment environment. Staging runs a production build (NODE_ENV=production) with synthetic
 * data only: AMANAH_DEPLOYMENT_ENV=staging on the server, NEXT_PUBLIC_AMANAH_ENVIRONMENT=staging
 * at build time (banner, noindex). See docs/strategy/22-staging-und-pilot.md.
 */
export type DeploymentEnv = "production" | "staging" | "development";

export function getDeploymentEnv(env: NodeJS.ProcessEnv = process.env): DeploymentEnv {
  if (env.AMANAH_DEPLOYMENT_ENV === "staging" || env.NEXT_PUBLIC_AMANAH_ENVIRONMENT === "staging") return "staging";
  return env.NODE_ENV === "production" ? "production" : "development";
}

/** Inlined at build time, usable in client components. */
export function isStagingBuild(): boolean {
  return process.env.NEXT_PUBLIC_AMANAH_ENVIRONMENT === "staging";
}

/**
 * Optional allow-list (AMANAH_REGISTRATION_ALLOWED_DOMAINS, comma-separated). Staging uses
 * reserved test domains such as staging.invalid, so real addresses cannot be registered there.
 */
export function isRegistrationDomainAllowed(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.AMANAH_REGISTRATION_ALLOWED_DOMAINS?.trim();
  if (!raw) return true;
  const domain = email.trim().toLowerCase().split("@").at(-1) ?? "";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .includes(domain);
}
