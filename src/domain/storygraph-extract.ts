import type { BookIdentity } from './book';

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function documentText(root: Document): string {
  const body = root.body;
  if (!body) return '';
  return (body as HTMLElement).innerText || body.textContent || '';
}

function findLabeledValue(root: Document, label: string): string | undefined {
  const match = documentText(root).match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'));
  return clean(match?.[1]) || undefined;
}

function parseOgTitle(root: Document): { title?: string; author?: string } {
  const raw = clean(root.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content).replace(
    /\s*\|\s*The StoryGraph\s*$/i,
    ''
  );

  if (!raw) return {};

  const byMatch = raw.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { title: clean(byMatch[1]), author: clean(byMatch[2]) };
  }

  return { title: raw };
}

const SECTION_HEADING = /^(editions|description|community reviews|content warnings)$/i;

function headingLabel(heading: HTMLElement): string {
  const clone = heading.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.sr-only, svg, [aria-hidden="true"]').forEach((node) => node.remove());
  return clean(clone.textContent);
}

function isRendered(element: HTMLElement): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view) return true;

  let node: HTMLElement | null = element;
  while (node) {
    const style = view.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    node = node.parentElement;
  }
  return true;
}

export function findBookHeading(root: Document, expectedTitle?: string): HTMLElement | null {
  const headings = [...root.querySelectorAll<HTMLElement>('h1, h2, h3')];
  const rendered = headings.filter(isRendered);
  const candidates = rendered.length > 0 ? rendered : headings;
  const normalizedExpected = clean(expectedTitle).toLowerCase();

  if (normalizedExpected) {
    const exact = candidates.find((heading) => headingLabel(heading).toLowerCase() === normalizedExpected);
    if (exact) return exact;
  }

  return (
    candidates.find((heading) => {
      const text = headingLabel(heading);
      return text && !SECTION_HEADING.test(text);
    }) ?? null
  );
}

export function panelInsertionPoint(heading: HTMLElement): HTMLElement {
  const parent = heading.parentElement;
  if (parent && /^editions\b/i.test(headingLabel(heading))) return parent;
  return heading;
}

function titleFromHeading(heading: HTMLElement | null): string {
  if (!heading) return '';
  const label = headingLabel(heading);
  if (/^editions\b/i.test(label)) {
    return clean(heading.querySelector('a')?.textContent) || label;
  }
  return label;
}

function findAuthorNearHeading(root: Document, heading: HTMLElement | null): string {
  if (heading) {
    const container = heading.parentElement;
    const localAuthor = container?.querySelector<HTMLElement>('a[href*="/authors/"]');
    const text = clean(localAuthor?.textContent);
    if (text) return text;
  }

  return clean(root.querySelector<HTMLElement>('a[href*="/authors/"], [rel="author"]')?.textContent);
}

export function extractStoryGraphBook(
  root: Document = document,
  storygraphUrl: string = root.defaultView?.location.href ?? location.href
): BookIdentity | null {
  const metadata = parseOgTitle(root);
  const heading = findBookHeading(root, metadata.title);

  const title = metadata.title || titleFromHeading(heading);
  const author = metadata.author || findAuthorNearHeading(root, heading);

  const isbnCandidate = findLabeledValue(root, 'ISBN/UID');
  const isbn = isbnCandidate?.match(/[0-9Xx-]{10,17}/)?.[0]?.replace(/-/g, '');

  if (!title || !author) return null;

  return { title, author, isbn, storygraphUrl };
}
