import { describe, expect, it } from "vitest";
import type { KuCheckResult } from "../src/domain/book";
import { statusCopy, toneForStatus, viewForResult } from "../src/content/storygraph-panel";

const book = {
  title: "Piranesi",
  author: "Susanna Clarke",
  storygraphUrl: "https://app.thestorygraph.com/books/piranesi"
};

function result(status: KuCheckResult["status"]): KuCheckResult {
  return {
    book,
    status,
    amazonUrl: "https://www.amazon.com/dp/B08HQ5NB5W",
    evidence: [],
    checkedAt: Date.now()
  };
}

describe("viewForResult", () => {
  it("uses a quiet idle state before any check", () => {
    expect(viewForResult()).toMatchObject({
      tone: "idle",
      checkLabel: "Check Kindle Unlimited",
      checkDisabled: false
    });
  });

  it("maps a successful check to the available tone", () => {
    const view = viewForResult(result("AVAILABLE"));
    expect(view.tone).toBe("available");
    expect(view.title).toBe("Available on Kindle Unlimited");
    expect(view.checkLabel).toBe("Check again");
    expect(view.amazonUrl).toContain("/dp/");
  });

  it("keeps timeout copy free of em dashes", () => {
    const copy = statusCopy("TIMED_OUT");
    expect(copy.title).toBe("Amazon check timed out");
    expect(`${copy.title} ${copy.detail}`).not.toMatch(/[—–]/);
    expect(toneForStatus("TIMED_OUT")).toBe("timeout");
  });
});
