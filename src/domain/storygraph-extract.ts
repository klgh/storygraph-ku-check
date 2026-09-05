import type { BookIdentity } from "./book";

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function documentText(root: Document): string {
  const body = root.body;
  if (!body) return "";
  return (body as HTMLElement).innerText || body.textContent || "";
}

function findLabeledValue(root: Document, label: string): string | undefined {
  const match = documentText(root).match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
  return clean(match?.[1]) || undefined;
}

function parseOgTitle(root: Document): { title?: string; author?: string } {
  const raw = clean(root.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content)
    .replace(/\s*\|\s*The StoryGraph\s*$/i, "");

  if (!raw) return {};

  const byMatch = raw.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { title: clean(byMatch[1]), author: clean(byMatch[2]) };
  }

  return { title: raw };
}

export function findBookHeading(root: Document, expectedTitle?: string): HTMLElement | null {
  const headings = [...root.querySelectorAll<HTMLElement>("h1, h2, h3")];
  const normalizedExpected = clean(expectedTitle).toLowerCase();

  if (normalizedExpected) {
    const exact = headings.find((heading) => clean(heading.textContent).toLowerCase() === normalizedExpected);
    if (exact) return exact;
  }

  return headings.find((heading) => {
    const text = clean(heading.textContent);
    return text && !/^(editions|description|community reviews|content warnings)$/i.test(text);
  }) ?? null;
}

function findAuthorNearHeading(root: Document, heading: HTMLElement | null): string {
  if (heading) {
    const container = heading.parentElement;
    const localAuthor = container?.querySelector<HTMLElement>('a[href*="/authors/"]');
    const text = clean(localAuthor?.textContent);
    if (text) return text;
  }

  return clean(
    root.querySelector<HTMLElement>('a[href*="/authors/"], [rel="author"]')?.textContent
  );
}

export function extractStoryGraphBook(
  root: Document = document,
  storygraphUrl: string = root.defaultView?.location.href ?? location.href
): BookIdentity | null {
  const metadata = parseOgTitle(root);
  const heading = findBookHeading(root, metadata.title);

  const title = metadata.title || clean(heading?.textContent);
  const author = metadata.author || findAuthorNearHeading(root, heading);

  const isbnCandidate = findLabeledValue(root, "ISBN/UID");
  const isbn = isbnCandidate?.match(/[0-9Xx-]{10,17}/)?.[0]?.replace(/-/g, "");

  if (!title || !author) return null;

  return { title, author, isbn, storygraphUrl };
}
