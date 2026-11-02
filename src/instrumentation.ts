export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { enforceDeletionLedger } = await import("@/lib/server/deletion-gate");
    try {
      await enforceDeletionLedger();
    } catch (error) {
      // Stops the server before it answers a single request. Logs the code only.
      const code = error instanceof Error ? error.message : "unknown";
      console.error(`[deletion-ledger] start refused: ${code}`);
      process.exit(1);
    }
    const { startHistoryPurge } = await import("@/lib/server/history-purge");
    startHistoryPurge();
  }
}
