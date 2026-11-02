/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

const flush = async () => {
  for (let i = 0; i < 100; i++) await Promise.resolve();
};

describe("browser storage is full", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports the failure once instead of writing forever", async () => {
    let writes = 0;
    // After 50 writes the mock stops failing, so that the old endless loop fails here instead of hanging.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      writes += 1;
      if (writes <= 50) throw new DOMException("full", "QuotaExceededError");
    });

    useAmanahStore.getState().updateField("assets", []);
    await flush();

    expect(writes).toBeLessThanOrEqual(3);
    expect(useAmanahStore.getState().saveStatus).toBe("error");
    expect(useAmanahStore.getState().saveError).toContain("Speicher dieses Browsers ist voll");
  });
});
