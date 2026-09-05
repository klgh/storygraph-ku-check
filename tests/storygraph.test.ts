import { afterEach, describe, expect, it } from "vitest";
import { extractStoryGraphBook, findBookHeading } from "../src/domain/storygraph-extract";

const BOOK_URL = "https://app.thestorygraph.com/books/example-book";

function mount(html: string): Document {
  document.documentElement.innerHTML = html;
  return document;
}

afterEach(() => {
  document.documentElement.innerHTML = "";
});

describe("extractStoryGraphBook", () => {
  it("reads title and author from the Open Graph title", () => {
    mount(`
      <head>
        <meta property="og:title" content="Piranesi by Susanna Clarke | The StoryGraph">
      </head>
      <body>
        <h1>A different heading on the page</h1>
        <p>ISBN/UID: 9781635577808</p>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)).toEqual({
      title: "Piranesi",
      author: "Susanna Clarke",
      isbn: "9781635577808",
      storygraphUrl: BOOK_URL
    });
  });

  it("falls back to the book heading and nearby author link", () => {
    mount(`
      <body>
        <div>
          <h1>The Priory of the Orange Tree</h1>
          <a href="/authors/samantha-shannon">Samantha Shannon</a>
        </div>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)).toEqual({
      title: "The Priory of the Orange Tree",
      author: "Samantha Shannon",
      isbn: undefined,
      storygraphUrl: BOOK_URL
    });
  });

  it("prefers the author next to the heading over another author on the page", () => {
    mount(`
      <body>
        <a href="/authors/wrong-person">Wrong Person</a>
        <div>
          <h1>This Is How You Lose the Time War</h1>
          <a href="/authors/amal-el-mohtar">Amal El-Mohtar</a>
        </div>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)?.author).toBe("Amal El-Mohtar");
  });

  it("skips section headings when choosing the book title", () => {
    mount(`
      <body>
        <h2>Description</h2>
        <h2>Editions</h2>
        <h1>Project Hail Mary</h1>
        <a href="/authors/andy-weir">Andy Weir</a>
        <h3>Community reviews</h3>
      </body>
    `);

    const heading = findBookHeading(document);
    expect(heading?.textContent?.trim()).toBe("Project Hail Mary");
    expect(extractStoryGraphBook(document, BOOK_URL)?.title).toBe("Project Hail Mary");
  });

  it("strips hyphens from an ISBN/UID value", () => {
    mount(`
      <body>
        <h1>Example Book</h1>
        <a href="/authors/example">Example Author</a>
        <p>ISBN/UID: 978-1-2345-6789-0</p>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)?.isbn).toBe("9781234567890");
  });

  it("returns null when the author cannot be found", () => {
    mount(`
      <body>
        <h1>Untitled Notes</h1>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)).toBeNull();
  });

  it("returns null when the title cannot be found", () => {
    mount(`
      <body>
        <a href="/authors/example">Example Author</a>
      </body>
    `);

    expect(extractStoryGraphBook(document, BOOK_URL)).toBeNull();
  });
});
