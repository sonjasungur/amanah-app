import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FolderProblemGate } from "@/components/dashboard/folder-problem-gate";
import { I18nProvider } from "@/lib/i18n/context";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

let path = "/dashboard/notfallkarte";
vi.mock("next/navigation", () => ({ usePathname: () => path }));

const show = () =>
  render(
    <I18nProvider>
      <FolderProblemGate>
        <input aria-label="Formular" />
      </FolderProblemGate>
    </I18nProvider>
  );

afterEach(() => {
  cleanup();
  useAmanahStore.setState({ folderProblem: null });
  path = "/dashboard/notfallkarte";
});

describe("FolderProblemGate", () => {
  it("shows the forms when the folder is known", () => {
    show();
    expect(screen.getByLabelText("Formular")).toBeTruthy();
    expect(screen.queryByTestId("folder-problem")).toBeNull();
  });

  it.each(["unreadable", "load_failed"] as const)("%s: explains the state and offers no empty form", (problem) => {
    useAmanahStore.setState({ folderProblem: problem });
    show();
    expect(screen.getByRole("alert").textContent).toMatch(/nicht verändert|not been changed/);
    expect(screen.getByTestId("folder-problem-retry")).toBeTruthy();
    expect(screen.queryByLabelText("Formular")).toBeNull();
  });

  it("keeps the settings reachable, for account and consent", () => {
    path = "/dashboard/einstellungen";
    useAmanahStore.setState({ folderProblem: "unreadable" });
    show();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByLabelText("Formular")).toBeTruthy();
  });
});
