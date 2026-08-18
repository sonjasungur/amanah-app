import { getAuthMode } from "./config";

/** Public account creation. Default off in API/production. Local demo stays usable. */
export function isPublicRegistrationEnabled(): boolean {
  if (getAuthMode() === "local") return true;
  const value =
    process.env.AMANAH_PUBLIC_REGISTRATION_ENABLED ?? process.env.NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED;
  return value === "true" || value === "1";
}
