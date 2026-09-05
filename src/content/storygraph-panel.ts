import type { KuCheckResult, KuStatus } from "../domain/book";
import panelStyles from "./storygraph-panel.css?inline";

export type PanelTone =
  | "idle"
  | "checking"
  | "available"
  | "absent"
  | "uncertain"
  | "empty"
  | "timeout"
  | "error";

export interface PanelView {
  tone: PanelTone;
  title: string;
  detail?: string;
  amazonUrl?: string;
  checkLabel: string;
  checkDisabled: boolean;
}

export function statusCopy(status: KuStatus): { title: string; detail?: string } {
  switch (status) {
    case "AVAILABLE":
      return { title: "Available on Kindle Unlimited" };
    case "NOT_DETECTED":
      return {
        title: "Kindle Unlimited was not detected",
        detail: "The matching Amazon page did not show Unlimited."
      };
    case "UNCERTAIN":
      return {
        title: "Possible match",
        detail: "Confirm the listing on Amazon before you rely on this."
      };
    case "NO_MATCH":
      return {
        title: "No matching Kindle edition found",
        detail: "Amazon search did not return a close enough result."
      };
    case "TIMED_OUT":
      return {
        title: "Amazon check timed out",
        detail: "Try again, or open the Amazon page yourself."
      };
    default:
      return { title: "Checking Kindle Unlimited" };
  }
}

export function toneForStatus(status: KuStatus): PanelTone {
  switch (status) {
    case "AVAILABLE":
      return "available";
    case "NOT_DETECTED":
      return "absent";
    case "UNCERTAIN":
      return "uncertain";
    case "NO_MATCH":
      return "empty";
    case "TIMED_OUT":
      return "timeout";
    default:
      return "checking";
  }
}

export function viewForResult(result?: KuCheckResult): PanelView {
  if (!result) {
    return {
      tone: "idle",
      title: "Kindle Unlimited not checked",
      detail: "See if this book is included with Unlimited.",
      checkLabel: "Check Kindle Unlimited",
      checkDisabled: false
    };
  }

  const copy = statusCopy(result.status);
  return {
    tone: toneForStatus(result.status),
    title: copy.title,
    detail: copy.detail,
    amazonUrl: result.amazonUrl,
    checkLabel: result.status === "CHECKING" ? "Checking" : "Check again",
    checkDisabled: result.status === "CHECKING"
  };
}

export function paintKuPanel(
  host: HTMLElement,
  view: PanelView,
  onCheck: () => void
): void {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  host.dataset.tone = view.tone;

  root.innerHTML = `
    <style>${panelStyles}</style>
    <div class="panel">
      <div class="status">
        <span class="pip" aria-hidden="true"></span>
        <div class="copy">
          <p class="title" role="status">${escapeHtml(view.title)}</p>
          ${view.detail ? `<p class="detail">${escapeHtml(view.detail)}</p>` : ""}
        </div>
      </div>
      <div class="actions">
        <button class="check" type="button"${view.checkDisabled ? " disabled" : ""}>${escapeHtml(view.checkLabel)}</button>
        ${view.amazonUrl ? `<a class="amazon" href="${escapeAttr(view.amazonUrl)}" target="_blank" rel="noopener noreferrer">View on Amazon</a>` : ""}
      </div>
    </div>
  `;

  root.querySelector("button")?.addEventListener("click", onCheck);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
