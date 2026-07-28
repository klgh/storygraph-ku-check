import type { BookIdentity, KuCheckResult } from "../domain/book";
import type { ExtensionMessage } from "../shared/messages";

const ROOT_ID = "sg-ku-checker-root";
let localCheckTimer: number | undefined;
let activeCheckId: string | undefined;
let resultPollTimer: number | undefined;

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function findLabeledValue(label: string): string | undefined {
  const text = document.body.innerText;
  const match = text.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
  return clean(match?.[1]) || undefined;
}

function parseOgTitle(): { title?: string; author?: string } {
  const raw = clean(document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content)
    .replace(/\s*\|\s*The StoryGraph\s*$/i, "");

  if (!raw) return {};

  const byMatch = raw.match(/^(.*?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return { title: clean(byMatch[1]), author: clean(byMatch[2]) };
  }

  return { title: raw };
}

function findBookHeading(expectedTitle?: string): HTMLElement | null {
  const headings = [...document.querySelectorAll<HTMLElement>("h1, h2, h3")];
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

function findAuthorNearHeading(heading: HTMLElement | null): string {
  if (heading) {
    const container = heading.parentElement;
    const localAuthor = container?.querySelector<HTMLElement>('a[href*="/authors/"]');
    const text = clean(localAuthor?.textContent);
    if (text) return text;
  }

  return clean(
    document.querySelector<HTMLElement>('a[href*="/authors/"], [rel="author"]')?.textContent
  );
}

export function extractStoryGraphBook(): BookIdentity | null {
  const metadata = parseOgTitle();
  const heading = findBookHeading(metadata.title);

  const title = metadata.title || clean(heading?.textContent);
  const author = metadata.author || findAuthorNearHeading(heading);

  const isbnCandidate = findLabeledValue("ISBN/UID");
  const isbn = isbnCandidate?.match(/[0-9Xx-]{10,17}/)?.[0]?.replace(/-/g, "");

  if (!title || !author) return null;

  return { title, author, isbn, storygraphUrl: location.href };
}

function render(result?: KuCheckResult): void {
  const book = extractStoryGraphBook();
  if (!book) return;

  document.getElementById(ROOT_ID)?.remove();

  const root = document.createElement("section");
  root.id = ROOT_ID;
  root.style.cssText = [
    "margin: 12px 0",
    "padding: 12px",
    "border: 1px solid currentColor",
    "border-radius: 8px",
    "display: flex",
    "gap: 10px",
    "align-items: center",
    "flex-wrap: wrap"
  ].join(";");

  const status = document.createElement("span");
  status.textContent = result ? statusLabel(result) : "Kindle Unlimited status not checked";
  root.append(status);

  if (result?.amazonUrl) {
    const link = document.createElement("a");
    link.href = result.amazonUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on Amazon";
    root.append(link);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Check Kindle Unlimited";
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Checking Kindle Unlimited…";
    const message: ExtensionMessage = { type: "CHECK_BOOK", payload: book };
    const response = await chrome.runtime.sendMessage(message).catch(() => null);
    if (!response?.ok || !response.checkId) {
      button.disabled = false;
      status.textContent = "Unable to start check";
      return;
    }

    activeCheckId = response.checkId as string;
    startResultPolling(activeCheckId);

    window.clearTimeout(localCheckTimer);
    localCheckTimer = window.setTimeout(() => {
      button.disabled = false;
      status.textContent = "Amazon has not responded — try again";
    }, 50_000);
  });
  root.append(button);

  const heading = findBookHeading(book.title);
  heading?.insertAdjacentElement("afterend", root);
}

function statusLabel(result: KuCheckResult): string {
  switch (result.status) {
    case "AVAILABLE": return "Available on Kindle Unlimited";
    case "NOT_DETECTED": return "Kindle Unlimited was not detected";
    case "UNCERTAIN": return "Possible match; verify on Amazon";
    case "NO_MATCH": return "No matching Kindle result found";
    case "TIMED_OUT": return "Amazon check timed out — try again";
    default: return "Checking Kindle Unlimited…";
  }
}

function sameBook(a: BookIdentity, b: BookIdentity): boolean {
  const normalize = (value: string) => clean(value).toLowerCase();
  return normalize(a.title) === normalize(b.title) && normalize(a.author) === normalize(b.author);
}

function applyResult(result: KuCheckResult): void {
  const currentBook = extractStoryGraphBook();
  if (!currentBook || !sameBook(currentBook, result.book)) return;
  window.clearTimeout(localCheckTimer);
  window.clearTimeout(resultPollTimer);
  activeCheckId = undefined;
  render(result);
}

function startResultPolling(checkId: string): void {
  window.clearTimeout(resultPollTimer);
  const startedAt = Date.now();

  const poll = async () => {
    if (activeCheckId !== checkId) return;
    const response = await chrome.runtime.sendMessage({ type: "GET_CHECK_RESULT", checkId } satisfies ExtensionMessage).catch(() => null);
    if (response?.result) {
      applyResult(response.result as KuCheckResult);
      return;
    }
    if (Date.now() - startedAt < 50_000) {
      resultPollTimer = window.setTimeout(poll, 1000);
    }
  };

  void poll();
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type !== "KU_RESULT") return;
  if (activeCheckId && message.checkId !== activeCheckId) return;
  applyResult(message.payload);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !activeCheckId) return;
  const change = changes[`delivery:v6:${activeCheckId}`];
  if (change?.newValue) applyResult(change.newValue as KuCheckResult);
});

let previousUrl = location.href;
let renderTimer: number | undefined;
const observer = new MutationObserver(() => {
  if (previousUrl !== location.href) previousUrl = location.href;
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => {
    if (!document.getElementById(ROOT_ID)) render();
  }, 300);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

render();
