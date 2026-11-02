export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startHistoryPurge } = await import("@/lib/server/history-purge");
    startHistoryPurge();
  }
}
