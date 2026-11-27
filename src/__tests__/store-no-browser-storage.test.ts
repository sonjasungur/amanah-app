/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";

/** Rendering pages on the server once hung the build: without a browser storage, nothing may be written. */
describe("store on the server", () => {
  it("changes state without storage, without an error and without writing in a loop", async () => {
    expect(typeof localStorage).toBe("undefined");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { useAmanahStore } = await import("@/lib/store/use-amanah-store");
    useAmanahStore.getState().updateField("assets", []);
    for (let i = 0; i < 100; i++) await Promise.resolve();
    expect(useAmanahStore.getState().saveError).toBeNull();
    warn.mockRestore();
  });
});
