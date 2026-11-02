import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataHistoryView } from "@/components/history/data-history-view";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { flattenForDisplay, sectionLabel } from "@/lib/history/display";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

const VERSION = { id: "v1", changeType: "save", sections: ["emergencyCard"], createdAt: "2026-11-01T10:00:00.000Z" };
const DETAIL = { ...VERSION, prior: { emergencyCard: { name: "<img src=x onerror=alert(1)>", allergies: "", contact: { phone: "123" } } } };

type Route = { status?: number; body?: unknown };

function mockApi(routes: Record<string, Route>) {
  const calls: { url: string; method: string; body?: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      calls.push({ url, method, body: init.body as string | undefined });
      const route = routes[`${method} ${url}`] ?? { status: 500 };
      return new Response(JSON.stringify(route.body ?? {}), { status: route.status ?? 200 });
    }),
  );
  return calls;
}

const listOf = (versions: unknown[]) => ({ body: { versions, retentionDays: 90, maxVersions: 50 } });

beforeEach(() => useAmanahStore.setState({ ...structuredClone(defaultAmanahData) }));
afterEach(() => vi.unstubAllGlobals());

describe("history view", () => {
  it("says it is not available while switched off, and offers nothing", async () => {
    mockApi({ "GET /api/amanah/history": { status: 404 } });
    render(<DataHistoryView />);
    await waitFor(() => expect(screen.getByTestId("history-unavailable").textContent).toContain("noch nicht verfügbar"));
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("asks to sign in without a session", async () => {
    mockApi({ "GET /api/amanah/history": { status: 401 } });
    render(<DataHistoryView />);
    await waitFor(() => expect(screen.getByTestId("history-unavailable").textContent).toContain("melde dich an"));
  });

  it("lists dates and areas in plain words and states the retention", async () => {
    mockApi({ "GET /api/amanah/history": listOf([VERSION]) });
    render(<DataHistoryView />);
    await waitFor(() => expect(screen.getByTestId("history-list").textContent).toContain("Notfallkarte"));
    expect(screen.getByTestId("data-history").textContent).toContain("90 Tage");
    expect(screen.getByTestId("data-history").textContent).toContain("kein Testament");
  });

  it("shows content as text, never as markup", async () => {
    mockApi({ "GET /api/amanah/history": listOf([VERSION]), "GET /api/amanah/history/v1": { body: { version: DETAIL } } });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByRole("button", { name: /ansehen$/ }));
    const view = await screen.findByTestId("history-version");
    expect(view.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(view.querySelector("img")).toBeNull();
    expect(view.textContent).toContain("123");
  });

  it("restores only after a second step with a ticked confirmation, then updates the local data", async () => {
    const restored = { ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Früher" } };
    const calls = mockApi({
      "GET /api/amanah/history": listOf([VERSION]),
      "GET /api/amanah/history/v1": { body: { version: DETAIL } },
      "POST /api/amanah/history/v1/restore": { body: { data: restored, writeScope: "full" } },
    });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByRole("button", { name: /ansehen$/ }));
    fireEvent.click(await screen.findByTestId("history-restore"));
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    const submit = screen.getByTestId("history-confirm-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(document.activeElement?.id).toBe("history-confirm-heading");
    fireEvent.click(submit);
    expect(calls.some((c) => c.method === "POST")).toBe(false);

    fireEvent.click(screen.getByTestId("history-confirm-check"));
    await act(async () => fireEvent.click(screen.getByTestId("history-confirm-submit")));
    await waitFor(() => expect(screen.getByTestId("history-notice").textContent).toContain("Wiederhergestellt"));
    expect(calls.find((c) => c.method === "POST")?.body).toBe(JSON.stringify({ confirmed: true }));
    expect(useAmanahStore.getState().emergencyCard.name).toBe("Früher");
  });

  it("cancelling restores nothing", async () => {
    const calls = mockApi({ "GET /api/amanah/history": listOf([VERSION]), "GET /api/amanah/history/v1": { body: { version: DETAIL } } });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByRole("button", { name: /ansehen$/ }));
    fireEvent.click(await screen.findByTestId("history-restore"));
    fireEvent.click(screen.getByTestId("history-confirm-check"));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByTestId("history-confirm")).toBeNull();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("a free account gets back only free sections; what lives in this browser stays", async () => {
    useAmanahStore.setState({ familyMessage: { ...defaultAmanahData.familyMessage, familyLetter: "Nur im Browser" } });
    const restored = { ...defaultAmanahData, emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Früher" } };
    mockApi({
      "GET /api/amanah/history": listOf([VERSION]),
      "GET /api/amanah/history/v1": { body: { version: DETAIL } },
      "POST /api/amanah/history/v1/restore": { body: { data: restored, writeScope: "free_sections" } },
    });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByRole("button", { name: /ansehen$/ }));
    fireEvent.click(await screen.findByTestId("history-restore"));
    fireEvent.click(screen.getByTestId("history-confirm-check"));
    await act(async () => fireEvent.click(screen.getByTestId("history-confirm-submit")));
    await waitFor(() => expect(screen.getByTestId("history-notice").textContent).toContain("nur die kostenlos"));
    const state = useAmanahStore.getState();
    expect(state.emergencyCard.name).toBe("Früher");
    expect(state.familyMessage.familyLetter).toBe("Nur im Browser");
  });

  it("a failed restore says that nothing changed", async () => {
    mockApi({
      "GET /api/amanah/history": listOf([VERSION]),
      "GET /api/amanah/history/v1": { body: { version: DETAIL } },
      "POST /api/amanah/history/v1/restore": { status: 500 },
    });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByRole("button", { name: /ansehen$/ }));
    fireEvent.click(await screen.findByTestId("history-restore"));
    fireEvent.click(screen.getByTestId("history-confirm-check"));
    await act(async () => fireEvent.click(screen.getByTestId("history-confirm-submit")));
    await waitFor(() => expect(screen.getByTestId("history-error").textContent).toContain("nichts geändert"));
  });

  it("deleting asks first and names what stays", async () => {
    const calls = mockApi({ "GET /api/amanah/history": listOf([VERSION]), "DELETE /api/amanah/history": {} });
    render(<DataHistoryView />);
    fireEvent.click(await screen.findByTestId("history-delete-all"));
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
    expect(screen.getByTestId("history-delete-confirm").textContent).toContain("aktuellen Angaben bleiben erhalten");
    await act(async () => fireEvent.click(screen.getByTestId("history-delete-submit")));
    expect(calls.some((c) => c.method === "DELETE")).toBe(true);
  });
});

describe("display helpers", () => {
  it("flatten nested values, skip empty fields and ids", () => {
    expect(flattenForDisplay({ id: "x", a: "", b: "Text", c: [{ d: true }], e: null })).toEqual([{ path: "b", text: "Text" }, { path: "c 1 / d", text: "Ja" }]);
  });

  it("never show technical names for unknown sections", () => {
    expect(sectionLabel("assets")).toBe("Vermögensübersicht");
    expect(sectionLabel("somethingNew")).toBe("Weitere Angaben");
  });
});
