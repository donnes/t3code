import { describe, expect, it } from "vite-plus/test";
import {
  buildThreadContinuationPrompt,
  buildThreadContinuationTitle,
  buildWholeThreadContinuationPrompt,
} from "./threadContinuation.ts";

describe("thread continuation", () => {
  it("builds a read-only second-opinion prompt with deduplicated files", () => {
    const prompt = buildThreadContinuationPrompt({
      intent: "second-opinion",
      sourceThreadTitle: "Fix auth",
      userRequest: "Please fix auth.",
      assistantResponse: "Done.",
      changedFiles: ["src/auth.ts", "src/auth.ts"],
    });

    expect(prompt).toContain("Do not modify files");
    expect(prompt).toContain("Original request:\nPlease fix auth.");
    expect(prompt.match(/src\/auth\.ts/g)).toHaveLength(1);
    expect(
      buildThreadContinuationTitle({ intent: "second-opinion", sourceThreadTitle: "Fix auth" }),
    ).toBe("Review: Fix auth");
  });

  it("bounds transcript text", () => {
    const prompt = buildThreadContinuationPrompt({
      intent: "handoff",
      sourceThreadTitle: "Task",
      userRequest: "u".repeat(13_000),
      assistantResponse: "a".repeat(25_000),
    });

    expect(prompt).toContain("[truncated]");
    expect(prompt.length).toBeLessThan(37_000);
  });

  it("builds a continuation prompt from every message and all changed files", () => {
    const prompt = buildWholeThreadContinuationPrompt({
      intent: "second-opinion",
      sourceThreadTitle: "Fix auth",
      messages: [
        { role: "user", text: "Fix the login loop." },
        { role: "assistant", text: "I updated the callback." },
        { role: "user", text: "Please cover expired sessions too." },
        { role: "assistant", text: "Expired sessions now redirect once." },
      ],
      changedFiles: ["src/auth.ts", "src/callback.ts", "src/auth.ts"],
    });

    expect(prompt).toContain("full source thread");
    expect(prompt).toContain("Fix the login loop.");
    expect(prompt).toContain("Please cover expired sessions too.");
    expect(prompt).toContain("Expired sessions now redirect once.");
    expect(prompt.match(/src\/auth\.ts/g)).toHaveLength(1);
    expect(prompt).toContain("Do not modify files");
  });
});
