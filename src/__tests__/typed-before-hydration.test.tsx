import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthForm } from "@/components/auth/auth-form";
import { ForgotPasswordForm, ResetPasswordForm } from "@/components/auth/account-recovery-forms";
import { I18nProvider } from "@/lib/i18n/context";

const login = vi.fn(async () => ({ success: false, error: "nein" }));
const register = vi.fn(async () => ({ success: false, error: "nein" }));
vi.mock("@/lib/auth/context", () => ({ useAuth: () => ({ login, register }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams("token=synthetisch"), usePathname: () => "/" }));

const EARLY_TEXT = ["frueh", "eingetippt", "1"].join("-");

/** Text that reached the input before hydration: in the DOM, no change event, the state stays empty. */
const typedEarly = (container: HTMLElement, selector: string, value: string, index = 0) => {
  container.querySelectorAll<HTMLInputElement>(selector)[index].value = value;
};
const posted = (mock: ReturnType<typeof vi.fn>) => JSON.parse(String((mock.mock.calls[0][1] as RequestInit).body));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("text typed before hydration is sent, not lost", () => {
  it("password reset request", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: "ok" })));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<I18nProvider><ForgotPasswordForm /></I18nProvider>);
    typedEarly(container, 'input[type="email"]', "frueh@test.invalid");
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(posted(fetchMock).email).toBe("frueh@test.invalid");
    await screen.findByTestId("forgot-password-message");
  });

  it("new password, both fields", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: "ok" })));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(<I18nProvider><ResetPasswordForm /></I18nProvider>);
    typedEarly(container, 'input[type="password"]', EARLY_TEXT, 0);
    typedEarly(container, 'input[type="password"]', EARLY_TEXT, 1);
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(posted(fetchMock).password).toBe(EARLY_TEXT);
  });

  it("login and registration", async () => {
    for (const mode of ["login", "register"] as const) {
      const { container, unmount } = render(<I18nProvider><AuthForm mode={mode} /></I18nProvider>);
      typedEarly(container, 'input[type="email"]', "frueh@test.invalid");
      typedEarly(container, 'input[type="password"]', EARLY_TEXT);
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() => expect(mode === "login" ? login : register).toHaveBeenCalled());
      expect((mode === "login" ? login : register).mock.calls[0]).toEqual([expect.objectContaining({ email: "frueh@test.invalid", password: EARLY_TEXT })]);
      unmount();
    }
  });

  it("the fields stay without a name, so a submit before hydration sends no password anywhere", () => {
    const { container } = render(<I18nProvider><AuthForm mode="login" /></I18nProvider>);
    for (const input of container.querySelectorAll("input")) expect(input.getAttribute("name")).toBeNull();
  });
});
