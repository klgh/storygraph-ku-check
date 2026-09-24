import type { BookIdentity } from './book';
import { normalizeText } from './normalize';

export const MIN_SEARCH_RESULT_SCORE = 0.68;

function elementText(element: HTMLElement | null | undefined): string {
  if (!element) return '';
  return element.innerText || element.textContent || '';
}

export function scoreResult(result: HTMLElement, book: BookIdentity): number {
  const title = normalizeText(elementText(result.querySelector<HTMLElement>('h2')));
  const fullText = normalizeText(elementText(result));
  const expectedTitle = normalizeText(book.title);
  const expectedAuthor = normalizeText(book.author);

  let score = 0;
  if (title === expectedTitle) score += 0.72;
  else if (title.startsWith(expectedTitle) || expectedTitle.startsWith(title)) score += 0.55;
  else if (title.includes(expectedTitle) || expectedTitle.includes(title)) score += 0.4;

  if (fullText.includes(expectedAuthor)) score += 0.23;
  if (result.querySelector('a[href*="/dp/"]')) score += 0.05;
  return score;
}

export function pickBestSearchResult(root: ParentNode, book: BookIdentity): { href: string; score: number } | null {
  const results = [...root.querySelectorAll<HTMLElement>('[data-component-type="s-search-result"]')]
    .filter((element) => !elementText(element).toLowerCase().includes('sponsored'))
    .map((element) => ({ element, score: scoreResult(element, book) }))
    .sort((a, b) => b.score - a.score);

  const best = results[0];
  if (!best || best.score < MIN_SEARCH_RESULT_SCORE) return null;

  const link = best.element.querySelector<HTMLAnchorElement>('h2 a[href*="/dp/"], a[href*="/dp/"]');
  if (!link?.href) return null;

  return { href: link.href, score: best.score };
}
