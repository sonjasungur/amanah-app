/**
 * Testament preparation and the farāʾiḍ prototype stay off until the owner approves
 * the scope and scholars/lawyers have reviewed the rule set. Never default to on.
 */
export function isTestamentPreparationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION === "true";
}
