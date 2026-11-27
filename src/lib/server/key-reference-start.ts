import { checkKeyReferences, isKeyReferenceEnforced } from "./data-encryption";
import { prisma } from "./prisma";

/** A note for the operator, without keys. The folder API refuses by itself; public pages keep running. */
export async function logKeyReferenceAtStart(): Promise<void> {
  if (process.env.AMANAH_SERVER_STORAGE !== "postgres" || !isKeyReferenceEnforced()) return;
  try {
    const { status, kid } = checkKeyReferences(await prisma.dataKeyReference.findMany());
    if (status !== "ok") console.error(`[keys] folder access locked: ${status}${kid ? ` (key id '${kid}')` : ""}. See scripts/key-reference.mjs.`);
  } catch {
    console.error("[keys] reference could not be checked at start.");
  }
}
