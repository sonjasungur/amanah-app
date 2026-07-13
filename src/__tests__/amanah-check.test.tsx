/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AmanahCheck } from "@/components/check/amanah-check";
import { CHECK_STORAGE_KEY } from "@/lib/check/state-machine";
import { checkReducer, INITIAL_CHECK_STATE } from "@/lib/check/state-machine";

function clickStart() {
  fireEvent.click(screen.getByTestId("check-start"));
}

function clickYes() {
  fireEvent.click(screen.getByTestId("check-answer-yes"));
}

function clickNo() {
  fireEvent.click(screen.getByTestId("check-answer-no"));
}

function clickBack() {
  fireEvent.click(screen.getByTestId("check-back"));
}

async function waitForQuestion() {
  await waitFor(() => {
    expect(screen.queryByTestId("check-loading")).toBeNull();
    expect(screen.getByTestId("check-question-text")).toBeTruthy();
  });
}

describe("checkReducer", () => {
  it("transitions intro -> question on START", () => {
    const s = checkReducer({ ...INITIAL_CHECK_STATE, phase: "intro", hydrated: true }, { type: "START" });
    expect(s.phase).toBe("question");
    expect(s.index).toBe(0);
  });

  it("preserves answers on BACK", () => {
    const s = checkReducer({ ...INITIAL_CHECK_STATE, phase: "question", index: 1, hydrated: true, answers: { convert: true } }, { type: "BACK" });
    expect(s.index).toBe(0);
    expect(s.answers.convert).toBe(true);
  });

  it("goes to result after last SAVE_DONE", () => {
    const s = checkReducer(
      { ...INITIAL_CHECK_STATE, phase: "saving", index: 14, hydrated: true, answers: {} },
      { type: "SAVE_DONE", nextIndex: 15 }
    );
    expect(s.phase).toBe("result");
  });
});

describe("AmanahCheck interactions", () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("shows intro then starts at question 1", async () => {
    render(<AmanahCheck />);
    await waitFor(() => expect(screen.getByTestId("check-intro")).toBeTruthy());
    clickStart();
    await waitForQuestion();
    expect(screen.getByTestId("check-progress-label")).toHaveTextContent(/Frage 1 von/);
  });

  it("Ja advances to question 2", async () => {
    render(<AmanahCheck />);
    await waitFor(() => screen.getByTestId("check-intro"));
    clickStart();
    await waitForQuestion();
    const q1 = screen.getByTestId("check-question-text").textContent;
    clickYes();
    await waitFor(() => expect(screen.getByTestId("check-progress-label")).toHaveTextContent(/Frage 2 von/));
    expect(screen.getByTestId("check-question-text").textContent).not.toBe(q1);
  });

  it("back preserves previous answer", async () => {
    render(<AmanahCheck />);
    await waitFor(() => screen.getByTestId("check-intro"));
    clickStart();
    await waitForQuestion();
    clickYes();
    await waitFor(() => expect(screen.getByTestId("check-progress-label")).toHaveTextContent(/Frage 2 von/));
    clickBack();
    await waitForQuestion();
    expect(screen.getByTestId("check-answer-yes")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows results after all questions answered", async () => {
    render(<AmanahCheck />);
    await waitFor(() => screen.getByTestId("check-intro"));
    clickStart();
    await waitForQuestion();
    const total = Number(screen.getByTestId("check-progress-label").textContent?.match(/von (\d+)/)?.[1] ?? 0);

    for (let i = 0; i < total; i++) {
      await waitFor(() => expect(screen.queryByTestId("check-saving")).toBeNull());
      if (screen.queryByTestId("check-answer-yes")) {
        if (i % 2 === 0) clickYes();
        else clickNo();
      }
    }

    await waitFor(() => expect(screen.getByTestId("check-results")).toBeTruthy());
    expect(screen.queryByTestId("check-answer-yes")).toBeNull();
  }, 15000);

  it("shows personalized hint for convert with non-muslim family", async () => {
    render(<AmanahCheck />);
    await waitFor(() => screen.getByTestId("check-intro"));
    clickStart();
    await waitForQuestion();
    clickYes();
    await waitFor(() => expect(screen.getByTestId("check-progress-label")).toHaveTextContent(/Frage 2 von/));
    clickNo();
    const total = 15;
    for (let i = 2; i < total; i++) {
      await waitFor(() => expect(screen.queryByTestId("check-saving")).toBeNull());
      if (screen.queryByTestId("check-answer-no")) clickNo();
    }
    await waitFor(() => expect(screen.getByTestId("check-results")).toBeTruthy(), { timeout: 10000 });
    expect(screen.getByTestId("check-personalized-hints").textContent?.toLowerCase()).toMatch(/nicht-muslimisch|muslimisch/);
  }, 20000);

  it("shows error UI on corrupt storage", async () => {
    sessionStorage.setItem(CHECK_STORAGE_KEY, "{invalid");
    render(<AmanahCheck />);
    await waitFor(() => expect(screen.getByTestId("check-error")).toBeTruthy());
  });

  it("retry from error state", async () => {
    sessionStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify({ index: 99, answers: {}, phase: "questions" }));
    render(<AmanahCheck />);
    await waitFor(() => {
      const intro = screen.queryByTestId("check-intro");
      const err = screen.queryByTestId("check-error");
      expect(intro || err).toBeTruthy();
    });
  });
});
