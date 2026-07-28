import { describe, expect, it } from "vitest";

// Initial selector fixture. Replace with sanitized HTML captured from a real StoryGraph book page.
describe("StoryGraph fixture", () => {
  it("documents the expected visible metadata", () => {
    document.body.innerHTML = `
      <main>
        <h1>Example Book</h1>
        <a href="/authors/example">Example Author</a>
        <p>ISBN/UID: 9781234567890</p>
      </main>`;

    expect(document.body.innerText).toContain("ISBN/UID");
  });
});
