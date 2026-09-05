import type { BookIdentity } from "./book";
import { normalizeText } from "./normalize";

export const MIN_SEARCH_RESULT_SCORE = 0.68;

function elementText(element: HTMLElement | null | undefined): string {
  if (!element) return "";
  return element.innerText || element.textContent || "";
}

export function scoreResult(result: HTMLElement, book: BookIdentity): number {
  const title = normalizeText(elementText(result.querySelector<HTMLElement>("h2")));
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

export function pickBestSearchResult(
  root: ParentNode,
  book: BookIdentity
): { href: string; score: number } | null {
  const results = [...root.querySelectorAll<HTMLElement>('[data-component-type="s-search-result"]')]
    .filter((element) => !elementText(element).toLowerCase().includes("sponsored"))
    .map((element) => ({ element, score: scoreResult(element, book) }))
    .sort((a, b) => b.score - a.score);

  const best = results[0];
  if (!best || best.score < MIN_SEARCH_RESULT_SCORE) return null;

  const link = best.element.querySelector<HTMLAnchorElement>('h2 a[href*="/dp/"], a[href*="/dp/"]');
  if (!link?.href) return null;

  return { href: link.href, score: best.score };
}

function meaningfulTokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !["a", "an", "the", "novel", "book", "edition", "author"].includes(token));
}

function tokenCoverage(expected: string[], actual: string[]): number {
  if (expected.length === 0) return 0;
  const actualSet = new Set(actual);
  return expected.filter((token) => actualSet.has(token)).length / expected.length;
}

export function titleMatchScore(expectedValue: string, actualValue: string): number {
  const expected = normalizeText(expectedValue);
  const actual = normalizeText(actualValue);
  if (!expected || !actual) return 0;
  if (expected === actual) return 1;
  if (actual.startsWith(`${expected} `) || actual.includes(` ${expected} `)) return 0.98;
  if (actual.includes(expected)) return 0.96;

  const expectedTokens = meaningfulTokens(expected);
  const actualTokens = meaningfulTokens(actual);
  const coverage = tokenCoverage(expectedTokens, actualTokens);
  const ordered = expectedTokens.join(" ");
  const actualJoined = actualTokens.join(" ");

  if (ordered && actualJoined.includes(ordered)) return Math.max(coverage, 0.94);
  return coverage;
}

export function authorMatchScore(expectedValue: string, actualValue: string): number {
  const expected = normalizeText(expectedValue)
    .replace(/\b(author|editor|illustrator|narrator|contributor)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const actual = normalizeText(actualValue)
    .replace(/\b(author|editor|illustrator|narrator|contributor|visit|amazon|page)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!expected) return 1;
  if (!actual) return 0.65;
  if (actual.includes(expected) || expected.includes(actual)) return 1;

  const expectedTokens = meaningfulTokens(expected);
  const actualTokens = meaningfulTokens(actual);
  const coverage = tokenCoverage(expectedTokens, actualTokens);
  const expectedSurname = expectedTokens.at(-1);
  const surnameMatches = Boolean(expectedSurname && actualTokens.includes(expectedSurname));

  if (surnameMatches && coverage >= 0.5) return Math.max(coverage, 0.85);
  return coverage;
}

export function productMatchConfidence(
  book: BookIdentity,
  actualTitle: string,
  actualAuthor: string
): { confidence: number; titleScore: number; authorScore: number } {
  const titleScore = titleMatchScore(book.title, actualTitle);
  const authorScore = authorMatchScore(book.author, actualAuthor);
  const confidence = titleScore * 0.78 + authorScore * 0.22;
  return { confidence, titleScore, authorScore };
}

export function productMatchesBook(
  book: BookIdentity,
  actualTitle: string,
  actualAuthor: string
): boolean {
  const { confidence, titleScore, authorScore } = productMatchConfidence(book, actualTitle, actualAuthor);
  return titleScore >= 0.78 && authorScore >= 0.5 && confidence >= 0.75;
}
