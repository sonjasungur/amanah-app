import { afterEach, describe, expect, it } from "vitest";
import { answerSaveRequests, askOtherTabsToSave } from "@/lib/storage/tab-coordination";

const stops: (() => void)[] = [];
afterEach(() => stops.splice(0).forEach((stop) => stop()));

/** A tab of `owner` that answers with `saved` after `delayMs`. */
function tab(owner: string, saved: boolean, delayMs = 10) {
  const asked: string[] = [];
  stops.push(
    answerSaveRequests((userId) => {
      asked.push(userId);
      return userId === owner ? new Promise((resolve) => setTimeout(() => resolve(saved), delayMs)) : null;
    })
  );
  return asked;
}

describe("before a logout, the other tabs of the account", () => {
  it("are asked, and all saved means the logout may go ahead", async () => {
    tab("user-1", true);
    tab("user-1", true, 300);
    expect(await askOtherTabsToSave("user-1")).toEqual({ allSaved: true, tabs: 2 });
  });

  it("one tab that could not save stops the logout for a question", async () => {
    tab("user-1", true);
    tab("user-1", false);
    expect(await askOtherTabsToSave("user-1")).toEqual({ allSaved: false, tabs: 2 });
  });

  it("a tab of another account stays silent and is not counted", async () => {
    const asked = tab("user-2", false);
    expect(await askOtherTabsToSave("user-1")).toEqual({ allSaved: true, tabs: 0 });
    expect(asked).toEqual(["user-1"]);
  });

  it("a tab that does not answer in time counts as not saved", async () => {
    tab("user-1", true, 5_000);
    expect(await askOtherTabsToSave("user-1")).toEqual({ allSaved: false, tabs: 1 });
  }, 10_000);

  it("without other tabs the logout is not delayed by more than the announce window", async () => {
    const started = Date.now();
    expect(await askOtherTabsToSave("user-1")).toEqual({ allSaved: true, tabs: 0 });
    expect(Date.now() - started).toBeLessThan(500);
  });
});
