/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/auth/config", async (orig) => ({ ...(await orig<typeof import("@/lib/auth/config")>()), getStorageMode: () => "api", getAuthMode: () => "api" }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

const { saveBarState } = await import("@/components/storage/save-bar");
const { ConsentGate } = await import("@/components/dashboard/consent-gate");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("P2.5-A save state in plain words", () => {
  it("maps the store state to saved / unsaved changes / failed", () => {
    expect(saveBarState("saved", "2026-11-18T10:00:00Z")).toBe("gespeichert");
    expect(saveBarState("idle", "2026-11-18T10:00:00Z")).toBe("gespeichert");
    expect(saveBarState("saving", "2026-11-18T10:00:00Z")).toBe("ungespeichert");
    expect(saveBarState("error", "2026-11-18T10:00:00Z")).toBe("fehlgeschlagen");
    expect(saveBarState("partial", null)).toBe("teilweise");
    expect(saveBarState("idle", null)).toBe("leer");
  });
});

describe("P2.5-A consent: the answer is read, the waiting state always ends, nothing is sent twice", () => {
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  let posts = 0;

  beforeEach(() => {
    posts = 0;
  });

  async function openGate(onPost: () => Promise<Response>) {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts += 1;
        return onPost();
      }
      return json(200, { status: { sensitive_folder_storage: { granted: false } } });
    }));
    render(<ConsentGate><p>Ordner</p></ConsentGate>);
    await screen.findByTestId("consent-gate");
    fireEvent.click(screen.getByTestId("consent-checkbox"));
  }

  it("no connection: a clear message, and the button works again", async () => {
    await openGate(() => Promise.reject(new TypeError("Failed to fetch")));
    await act(async () => fireEvent.click(screen.getByTestId("consent-submit")));
    expect((await screen.findByTestId("consent-error")).textContent).toContain("Keine Verbindung");
    expect((screen.getByTestId("consent-submit") as HTMLButtonElement).disabled).toBe(false);
  });

  it("a refused grant shows the server's reason and opens nothing", async () => {
    await openGate(async () => json(400, { error: "Einwilligung unvollständig oder veraltet." }));
    await act(async () => fireEvent.click(screen.getByTestId("consent-submit")));
    expect((await screen.findByTestId("consent-error")).textContent).toContain("unvollständig oder veraltet");
    expect(screen.queryByText("Ordner")).toBeNull();
  });

  it("a double click sends one request, and a confirmed grant opens the folder", async () => {
    let release: (r: Response) => void = () => {};
    await openGate(() => new Promise<Response>((r) => (release = r)));
    const button = screen.getByTestId("consent-submit");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(posts).toBe(1);
    await act(async () => release(json(201, { consent: { purpose: "sensitive_folder_storage" } })));
    await waitFor(() => expect(screen.getByText("Ordner")).toBeTruthy());
  });
});
