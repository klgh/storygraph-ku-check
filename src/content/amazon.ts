import type { BookIdentity, KuCheckResult } from "../domain/book";
import { normalizeText } from "../domain/normalize";
import type { ExtensionMessage } from "../shared/messages";

const STRONG_KU_PATTERNS = [
  /included\s+with\s+kindle\s+unlimited/i,
  /read\s+(?:and\s+listen\s+)?for\s+free\s+with\s+kindle\s+unlimited/i,
  /read\s+for\s+free/i,
  /\$0\.00\s+(?:to\s+buy\s+)?(?:with|after)\s+kindle\s+unlimited/i,
  /borrow\s+for\s+free\s+with\s+kindle\s+unlimited/i
];

const KU_BADGE_PATTERN = /kindle[\s_-]*unlimited/i;

const OFFER_SELECTORS = [
  "#buybox",
  "#buyBoxAccordion",
  "#desktop_buybox",
  "#rightCol",
  "#tmmSwatches",
  "#tmm-grid-swatch-KINDLE",
  "#formats",
  "#mediaTab_content_landing",
  "#digitalDashHighProminenceBadge",
  "#kindleUnlimitedBadge",
  "#kindle-unlimited",
  "[data-a-expander-name='kindleUnlimited']",
  "[data-csa-c-content-id*='kindle']",
  "[data-csa-c-type*='kindle']",
  "[id*='kindleUnlimited']",
  "[id*='kindle-unlimited']",
  "[class*='kindleUnlimited']",
  "[class*='kindle-unlimited']",
  "[aria-label*='Kindle Unlimited' i]",
  "[title*='Kindle Unlimited' i]",
  "img[alt*='Kindle Unlimited' i]",
  "img[src*='kindle-unlimited' i]",
  "img[src*='kindleunlimited' i]"
].join(",");

function visibleText(node: HTMLElement): string {
  const style = getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return "";
  return node.innerText?.replace(/\s+/g, " ").trim() ?? "";
}

function addPatternEvidence(text: string, evidence: Set<string>): void {
  for (const pattern of STRONG_KU_PATTERNS) {
    const match = text.match(pattern)?.[0];
    if (match) evidence.add(match);
  }
}

function collectEvidence(root: ParentNode = document): string[] {
  const evidence = new Set<string>();

  // Strong phrases are sufficiently product-specific to scan across the page.
  const bodyText = document.body?.innerText?.replace(/\s+/g, " ") ?? "";
  addPatternEvidence(bodyText, evidence);

  for (const node of root.querySelectorAll<HTMLElement>(OFFER_SELECTORS)) {
    const text = visibleText(node);
    if (text) {
      addPatternEvidence(text, evidence);
      if (KU_BADGE_PATTERN.test(text)) evidence.add("Kindle Unlimited offer");
    }

    const attributes = [
      node.getAttribute("aria-label"),
      node.getAttribute("title"),
      node.getAttribute("alt"),
      node.getAttribute("src")
    ].filter((value): value is string => Boolean(value));

    if (attributes.some((value) => KU_BADGE_PATTERN.test(value))) {
      evidence.add("Kindle Unlimited badge");
    }
  }

  return [...evidence];
}

function productTitle(): string | undefined {
  return document.querySelector<HTMLElement>("#productTitle, #ebooksProductTitle, h1")?.innerText.trim();
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

async function sendResult(
  book: BookIdentity,
  checkId: string,
  status: KuCheckResult["status"],
  evidence: string[]
): Promise<void> {
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

  const message: ExtensionMessage = { type: "AMAZON_RESULT", payload: result, checkId };
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
  const timeoutMs = 30_000;
  let finished = false;

  const finish = (status: KuCheckResult["status"], evidence: string[]) => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    void sendResult(book, checkId, status, evidence);
  };

  const check = () => {
    if (finished) return;

    if (isSearchPage) {
      if (navigateToBestSearchResult(book, checkId)) return;
      if (Date.now() - startedAt >= timeoutMs) finish("NO_MATCH", []);
      return;
    }

    const pageLooksReady = Boolean(
      document.querySelector("#productTitle, #ebooksProductTitle") ||
      document.querySelector('link[rel="canonical"][href*="/dp/"]')
    );

    const evidence = collectEvidence();
    if (pageLooksReady && evidence.length > 0) {
      finish("AVAILABLE", evidence);
      return;
    }

    // Do not return a negative merely because one offer container appeared.
    // Amazon frequently renders the KU option several seconds later.
    if (pageLooksReady && Date.now() - startedAt >= timeoutMs) {
      finish("NOT_DETECTED", []);
    }
  };

  const observer = new MutationObserver(check);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "aria-label", "title", "alt", "src"]
  });

  const poll = window.setInterval(() => {
    check();
    if (finished) window.clearInterval(poll);
  }, 500);

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

  const response = await chrome.runtime
    .sendMessage({ type: "GET_AMAZON_CHECK" } satisfies ExtensionMessage)
    .catch(() => null);
  if (response?.ok && response.book && response.checkId) {
    waitForPage(response.book as BookIdentity, response.checkId as string);
  }
}

void initializeAmazonCheck();
