import type { BookIdentity, KuCheckResult } from "../domain/book";
import { normalizeText } from "../domain/normalize";
import type { ExtensionMessage } from "../shared/messages";

const KU_PATTERNS = [
  /included\s+with\s+kindle\s+unlimited/i,
  /kindle\s+unlimited/i,
  /read\s+for\s+free/i,
  /\$0\.00\s+(?:to\s+buy\s+)?(?:with|after)\s+kindle\s+unlimited/i
];

const OFFER_SELECTORS = [
  "#buybox",
  "#buyBoxAccordion",
  "#tmmSwatches",
  "#formats",
  "#mediaTab_content_landing",
  "#digitalDashHighProminenceBadge",
  "#kindleUnlimitedBadge",
  "[data-a-expander-name='kindleUnlimited']",
  "[data-csa-c-content-id*='kindle']",
  "[id*='kindleUnlimited']",
  "[class*='kindleUnlimited']"
].join(",");

function visibleText(node: HTMLElement): string {
  const style = getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return "";
  return node.innerText?.replace(/\s+/g, " ").trim() ?? "";
}

function collectEvidence(root: ParentNode = document): string[] {
  const evidence = new Set<string>();

  for (const node of root.querySelectorAll<HTMLElement>(OFFER_SELECTORS)) {
    const text = visibleText(node);
    if (!text) continue;
    for (const pattern of KU_PATTERNS) {
      const match = text.match(pattern)?.[0];
      if (match) evidence.add(match);
    }
  }

  return [...evidence];
}

function productTitle(): string | undefined {
  return document.querySelector<HTMLElement>("#productTitle, #ebooksProductTitle, h1")?.innerText.trim();
}

function productAuthor(): string {
  return [...document.querySelectorAll<HTMLElement>("#bylineInfo a, .author a, a.contributorNameID")]
    .map((node) => node.innerText.trim())
    .filter(Boolean)
    .join(" ");
}

function appendPayload(url: string, book: BookIdentity, checkId: string): string {
  const target = new URL(url, location.origin);
  target.searchParams.set("sgku_book", encodeURIComponent(JSON.stringify(book)));
  target.searchParams.set("sgku_check", checkId);
  return target.toString();
}

function scoreResult(result: HTMLElement, book: BookIdentity): number {
  const title = normalizeText(result.querySelector<HTMLElement>("h2")?.innerText ?? "");
  const fullText = normalizeText(result.innerText ?? "");
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

function navigateToBestSearchResult(book: BookIdentity, checkId: string): boolean {
  const results = [...document.querySelectorAll<HTMLElement>('[data-component-type="s-search-result"]')]
    .filter((element) => !element.innerText.toLowerCase().includes("sponsored"))
    .map((element) => ({ element, score: scoreResult(element, book) }))
    .sort((a, b) => b.score - a.score);

  const best = results[0];
  if (!best || best.score < 0.68) return false;

  const link = best.element.querySelector<HTMLAnchorElement>('h2 a[href*="/dp/"], a[href*="/dp/"]');
  if (!link?.href) return false;

  location.href = appendPayload(link.href, book, checkId);
  return true;
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

function titleMatchScore(expectedValue: string, actualValue: string): number {
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

function authorMatchScore(expectedValue: string, actualValue: string): number {
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

function productMatchConfidence(book: BookIdentity): { confidence: number; titleScore: number; authorScore: number } {
  const titleScore = titleMatchScore(book.title, productTitle() ?? "");
  const authorScore = authorMatchScore(book.author, productAuthor());
  const confidence = titleScore * 0.78 + authorScore * 0.22;
  return { confidence, titleScore, authorScore };
}

function productMatchesBook(book: BookIdentity): boolean {
  const { confidence, titleScore, authorScore } = productMatchConfidence(book);
  return titleScore >= 0.78 && authorScore >= 0.5 && confidence >= 0.75;
}

async function sendResult(book: BookIdentity, checkId: string, status: KuCheckResult["status"], evidence: string[]): Promise<void> {
  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete("sgku_book");
  cleanUrl.searchParams.delete("sgku_check");

  const result: KuCheckResult = {
    book,
    status,
    amazonUrl: cleanUrl.toString(),
    matchedTitle: productTitle(),
    evidence,
    checkedAt: Date.now()
  };

  const message: ExtensionMessage = {
    type: "AMAZON_RESULT",
    payload: result,
    checkId
  };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await chrome.runtime.sendMessage(message).catch(() => null);
    if (response?.ok) return;
    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }
  console.error("Unable to return Kindle Unlimited result to the extension");
}

function waitForPage(book: BookIdentity, checkId: string): void {
  const isSearchPage = location.pathname === "/s";
  const startedAt = Date.now();
  const timeoutMs = 22_000;
  let readyPolls = 0;

  const check = () => {
    if (isSearchPage) {
      // The search-result scorer is the match gate. We only navigate when the
      // title/author result is strong enough, so do not reclassify that same
      // product as ambiguous after Amazon reformats its product heading.
      if (navigateToBestSearchResult(book, checkId)) return;
      if (Date.now() - startedAt < timeoutMs) {
        window.setTimeout(check, 500);
        return;
      }
      void sendResult(book, checkId, "NO_MATCH", []);
      return;
    }

    const pageLooksReady = Boolean(
      document.querySelector("#productTitle, #ebooksProductTitle") ||
      document.querySelector('link[rel="canonical"][href*="/dp/"]')
    );

    const evidence = collectEvidence();
    if (pageLooksReady && evidence.length > 0) {
      void sendResult(book, checkId, "AVAILABLE", evidence);
      return;
    }

    const offerAreaReady = Boolean(document.querySelector(OFFER_SELECTORS));
    if (pageLooksReady && offerAreaReady) readyPolls += 1;

    // Once the selected product page and its offer area have rendered, the
    // result is definitive for this check: KU evidence was either found or it
    // was not. Amazon's long subtitles/bylines no longer cause UNCERTAIN.
    if (readyPolls >= 8 || Date.now() - startedAt >= timeoutMs) {
      void sendResult(book, checkId, "NOT_DETECTED", []);
      return;
    }

    window.setTimeout(check, 500);
  };

  check();
}

async function initializeAmazonCheck(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const encodedBook = params.get("sgku_book");
  const queryCheckId = params.get("sgku_check");

  if (encodedBook && queryCheckId) {
    try {
      const book = JSON.parse(decodeURIComponent(encodedBook)) as BookIdentity;
      waitForPage(book, queryCheckId);
      return;
    } catch (error) {
      console.error("Invalid StoryGraph KU book payload", error);
    }
  }

  // Amazon can strip custom query parameters during redirects. Recover the
  // active check by using this Amazon tab's ID in the service worker.
  const response = await chrome.runtime.sendMessage({ type: "GET_AMAZON_CHECK" } satisfies ExtensionMessage).catch(() => null);
  if (response?.ok && response.book && response.checkId) {
    waitForPage(response.book as BookIdentity, response.checkId as string);
  }
}

void initializeAmazonCheck();
