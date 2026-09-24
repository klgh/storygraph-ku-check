import type { BookIdentity, KuCheckResult } from "../domain/book";
import { extractStoryGraphBook, findBookHeading } from "../domain/storygraph-extract";
import { paintKuPanel, viewForResult } from "./storygraph-panel";
import type { ExtensionMessage } from "../shared/messages";
import { getCachedResult } from "../storage/cache";

export { extractStoryGraphBook };

const ROOT_ID = "sg-ku-checker-root";
let localCheckTimer: number | undefined;
let activeCheckId: string | undefined;
let resultPollTimer: number | undefined;

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function ensureHost(bookTitle: string): HTMLElement | null {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLElement && existing.isConnected) return existing;

  const heading = findBookHeading(document, bookTitle);
  if (!heading) return null;

  const host = document.createElement("div");
  host.id = ROOT_ID;
  heading.insertAdjacentElement("afterend", host);
  return host;
}

function render(result?: KuCheckResult): void {
  const book = extractStoryGraphBook();
  if (!book) return;

  const host = ensureHost(book.title);
  if (!host) return;

  paintKuPanel(host, viewForResult(result), () => {
    void startCheck(book, host);
  });
}

function paintTimeout(book: BookIdentity): void {
  const host = ensureHost(book.title);
  if (!host) return;
  paintKuPanel(host, {
    tone: "timeout",
    title: "Amazon has not responded",
    detail: "Try again in a moment.",
    checkLabel: "Check again",
    checkDisabled: false
  }, () => {
    void startCheck(book, host);
  });
}

function paintChecking(host: HTMLElement): void {
  paintKuPanel(host, {
    tone: "checking",
    title: "Checking Kindle Unlimited",
    detail: "Looking up the matching Kindle edition on Amazon.",
    checkLabel: "Checking",
    checkDisabled: true
  }, () => undefined);
}

async function startCheck(book: BookIdentity, host: HTMLElement): Promise<void> {
  paintChecking(host);

  const message: ExtensionMessage = { type: "CHECK_BOOK", payload: book, force: true };
  const response = await chrome.runtime.sendMessage(message).catch(() => null);
  if (!response?.ok || !response.checkId) {
    paintKuPanel(host, {
      tone: "error",
      title: "Unable to start check",
      detail: "The extension could not reach Amazon. Try again.",
      checkLabel: "Check Kindle Unlimited",
      checkDisabled: false
    }, () => {
      void startCheck(book, host);
    });
    return;
  }

  activeCheckId = response.checkId as string;
  startResultPolling(activeCheckId, book);

  window.clearTimeout(localCheckTimer);
  localCheckTimer = window.setTimeout(() => {
    if (activeCheckId !== response.checkId) return;
    paintTimeout(book);
  }, 50_000);
}

function sameBook(a: BookIdentity, b: BookIdentity): boolean {
  const normalize = (value: string) => clean(value).toLowerCase();
  return normalize(a.title) === normalize(b.title) && normalize(a.author) === normalize(b.author);
}

function applyResult(result: KuCheckResult): boolean {
  const currentBook = extractStoryGraphBook();
  // Prefer the live page identity when present; fall back to the result's book
  // so a transient DOM parse miss does not drop a completed check.
  if (currentBook && !sameBook(currentBook, result.book)) return false;

  window.clearTimeout(localCheckTimer);
  window.clearTimeout(resultPollTimer);
  activeCheckId = undefined;
  render(result);
  return true;
}

function startResultPolling(checkId: string, book: BookIdentity): void {
  window.clearTimeout(resultPollTimer);
  const startedAt = Date.now();

  const poll = async () => {
    if (activeCheckId !== checkId) return;
    const response = await chrome.runtime.sendMessage({ type: "GET_CHECK_RESULT", checkId } satisfies ExtensionMessage).catch(() => null);
    if (response?.result && applyResult(response.result as KuCheckResult)) return;
    if (Date.now() - startedAt < 50_000) {
      resultPollTimer = window.setTimeout(poll, 1000);
      return;
    }
    if (activeCheckId === checkId) paintTimeout(book);
  };

  void poll();
}

function pollActiveCheck(): void {
  if (!activeCheckId) return;
  const checkId = activeCheckId;
  void (async () => {
    const response = await chrome.runtime.sendMessage({ type: "GET_CHECK_RESULT", checkId } satisfies ExtensionMessage).catch(() => null);
    if (response?.result) applyResult(response.result as KuCheckResult);
  })();
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

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") pollActiveCheck();
});

async function hydrate(): Promise<void> {
  const book = extractStoryGraphBook();
  if (!book) {
    render();
    return;
  }

  const cached = await getCachedResult(book).catch(() => null);
  render(cached ?? undefined);
}

let previousUrl = location.href;
let renderTimer: number | undefined;
const observer = new MutationObserver(() => {
  if (previousUrl !== location.href) previousUrl = location.href;
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(() => {
    if (document.getElementById(ROOT_ID)) return;
    if (activeCheckId) {
      const book = extractStoryGraphBook();
      if (!book) return;
      const host = ensureHost(book.title);
      if (host) paintChecking(host);
      return;
    }
    void hydrate();
  }, 300);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

void hydrate();
