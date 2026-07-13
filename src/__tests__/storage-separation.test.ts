import { describe, it, expect } from "vitest";
import { CHECK_STORAGE_KEY, clearCheckState, loadCheckState } from "@/lib/check/state-machine";

describe("storage separation", () => {
  it("check uses sessionStorage key amanah-check-progress-v3", () => {
    expect(CHECK_STORAGE_KEY).toBe("amanah-check-progress-v3");
  });

  it("clearCheckState only removes check key", () => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(CHECK_STORAGE_KEY, '{"index":1,"answers":{},"phase":"questions"}');
    localStorage.setItem("amanah-ordner-data", '{"test":true}');
    localStorage.setItem("amanah-familiengespraech-v1", '{"topics":{}}');
    clearCheckState();
    expect(sessionStorage.getItem(CHECK_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("amanah-ordner-data")).toBe('{"test":true}');
    expect(localStorage.getItem("amanah-familiengespraech-v1")).toBe('{"topics":{}}');
    localStorage.removeItem("amanah-ordner-data");
    localStorage.removeItem("amanah-familiengespraech-v1");
  });

  it("loadCheckState rejects invalid index", () => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({ index: 99, answers: {}, phase: "questions" }));
    const r = loadCheckState();
    expect(r.ok).toBe(false);
    sessionStorage.clear();
  });
});
