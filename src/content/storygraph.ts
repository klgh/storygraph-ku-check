import type { BookIdentity, KuCheckResult } from "../domain/book";
import { extractStoryGraphBook, findBookHeading } from "../domain/storygraph-extract";
import type { ExtensionMessage } from "../shared/messages";

export { extractStoryGraphBook };

const ROOT_ID = "sg-ku-checker-root";
let localCheckTimer: number | undefined;
let activeCheckId: string | undefined;
let resultPollTimer: number | undefined;

function clean(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
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

  const heading = findBookHeading(document, book.title);
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
