import type { BookIdentity, KuCheckResult } from "../domain/book";
import { pickBestSearchResult } from "../domain/amazon-match";
import { collectKuEvidence, offerAreaReady } from "../domain/amazon-ku";
import type { ExtensionMessage } from "../shared/messages";

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

function navigateToBestSearchResult(book: BookIdentity, checkId: string): boolean {
  const best = pickBestSearchResult(document, book);
  if (!best) return false;

  location.href = appendPayload(best.href, book, checkId);
  return true;
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

    const evidence = collectKuEvidence();
    if (pageLooksReady && evidence.length > 0) {
      void sendResult(book, checkId, "AVAILABLE", evidence);
      return;
    }

    // Personalized KU copy can hydrate after the shell buybox. Require a
    // longer settle when no KU widget has appeared yet.
    if (pageLooksReady && offerAreaReady()) readyPolls += 1;

    const settlePolls = document.getElementById("Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop") ? 4 : 12;
    if (readyPolls >= settlePolls || Date.now() - startedAt >= timeoutMs) {
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

  // Amazon often strips custom query params on redirect. The service worker
  // registers this tab id in session storage before navigation, so recover here.
  const response = await chrome.runtime.sendMessage({ type: "GET_AMAZON_CHECK" } satisfies ExtensionMessage).catch(() => null);
  if (response?.ok && response.book && response.checkId) {
    waitForPage(response.book as BookIdentity, response.checkId as string);
    return;
  }

  // Only keep retrying when a check id was present but the book payload failed.
  if (!queryCheckId) return;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    const retry = await chrome.runtime.sendMessage({ type: "GET_AMAZON_CHECK" } satisfies ExtensionMessage).catch(() => null);
    if (retry?.ok && retry.book && retry.checkId) {
      waitForPage(retry.book as BookIdentity, retry.checkId as string);
      return;
    }
  }
}

void initializeAmazonCheck();
