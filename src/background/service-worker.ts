import type { BookIdentity, KuCheckResult } from "../domain/book";
import type { ExtensionMessage, PendingCheck } from "../shared/messages";
import { getCachedResult, setCachedResult } from "../storage/cache";

const PENDING_PREFIX = "pending:v6:";
const AMAZON_TAB_PREFIX = "amazon-tab:v6:";
const DELIVERY_PREFIX = "delivery:v6:";
const ALARM_PREFIX = "sgku-timeout:";

const pendingKey = (checkId: string) => `${PENDING_PREFIX}${checkId}`;
const amazonTabKey = (tabId: number) => `${AMAZON_TAB_PREFIX}${tabId}`;
const deliveryKey = (checkId: string) => `${DELIVERY_PREFIX}${checkId}`;
const alarmName = (checkId: string) => `${ALARM_PREFIX}${checkId}`;

function buildAmazonSearchUrl(book: BookIdentity, checkId: string): string {
  const query = book.isbn || `${book.title} ${book.author}`;
  const payload = encodeURIComponent(JSON.stringify(book));
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=digital-text&sgku_book=${payload}&sgku_check=${encodeURIComponent(checkId)}`;
}

async function deliverResult(checkId: string, pending: PendingCheck, result: KuCheckResult): Promise<void> {
  if (result.status !== "TIMED_OUT") await setCachedResult(result);
  await chrome.storage.local.set({ [deliveryKey(checkId)]: result });
  await chrome.tabs.sendMessage(pending.sourceTabId, {
    type: "KU_RESULT",
    payload: result,
    checkId
  } satisfies ExtensionMessage).catch(() => undefined);
}

async function findCheckForAmazonTab(tabId: number): Promise<{ checkId: string; pending: PendingCheck } | null> {
  const tabMap = await chrome.storage.session.get(amazonTabKey(tabId));
  const checkId = tabMap[amazonTabKey(tabId)] as string | undefined;
  if (!checkId) return null;
  const stored = await chrome.storage.session.get(pendingKey(checkId));
  const pending = stored[pendingKey(checkId)] as PendingCheck | undefined;
  return pending ? { checkId, pending } : null;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const checkId = alarm.name.slice(ALARM_PREFIX.length);
  void (async () => {
    const key = pendingKey(checkId);
    const stored = await chrome.storage.session.get(key);
    const pending = stored[key] as PendingCheck | undefined;
    if (!pending) return;
    const result: KuCheckResult = {
      book: pending.book,
      status: "TIMED_OUT",
      amazonUrl: pending.amazonTabId ? (await chrome.tabs.get(pending.amazonTabId).catch(() => undefined))?.url : undefined,
      evidence: ["Amazon did not return a result before the extension timeout"],
      checkedAt: Date.now()
    };
    await deliverResult(checkId, pending, result);
    await chrome.storage.session.remove([key, ...(pending.amazonTabId ? [amazonTabKey(pending.amazonTabId)] : [])]);
  })().catch((error: unknown) => console.error("KU timeout handling failed", error));
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === "CHECK_BOOK") {
    void (async () => {
      if (sender.tab?.id == null) throw new Error("StoryGraph tab was not available");
      const cached = await getCachedResult(message.payload);
      if (cached) {
        const checkId = `cached-${crypto.randomUUID()}`;
        await chrome.storage.local.set({ [deliveryKey(checkId)]: cached });
        await chrome.tabs.sendMessage(sender.tab.id, { type: "KU_RESULT", payload: cached, checkId } satisfies ExtensionMessage).catch(() => undefined);
        sendResponse({ ok: true, cached: true, checkId });
        return;
      }

      const checkId = crypto.randomUUID();
      const pending: PendingCheck = { sourceTabId: sender.tab.id, book: message.payload, createdAt: Date.now() };
      await chrome.storage.session.set({ [pendingKey(checkId)]: pending });
      const amazonTab = await chrome.tabs.create({ url: buildAmazonSearchUrl(message.payload, checkId), active: true });
      if (amazonTab.id != null) {
        pending.amazonTabId = amazonTab.id;
        await chrome.storage.session.set({
          [pendingKey(checkId)]: pending,
          [amazonTabKey(amazonTab.id)]: checkId
        });
      }
      await chrome.alarms.create(alarmName(checkId), { delayInMinutes: 0.75 });
      sendResponse({ ok: true, cached: false, checkId });
    })().catch((error: unknown) => {
      console.error("Failed to start KU check", error);
      sendResponse({ ok: false });
    });
    return true;
  }

  if (message.type === "GET_AMAZON_CHECK") {
    void (async () => {
      if (sender.tab?.id == null) return sendResponse({ ok: false });
      const found = await findCheckForAmazonTab(sender.tab.id);
      sendResponse(found ? { ok: true, checkId: found.checkId, book: found.pending.book } : { ok: false });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === "GET_CHECK_RESULT") {
    void (async () => {
      const stored = await chrome.storage.local.get(deliveryKey(message.checkId));
      sendResponse({ ok: true, result: stored[deliveryKey(message.checkId)] ?? null });
    })().catch(() => sendResponse({ ok: false, result: null }));
    return true;
  }

  if (message.type === "AMAZON_RESULT") {
    void (async () => {
      const key = pendingKey(message.checkId);
      const stored = await chrome.storage.session.get(key);
      const pending = stored[key] as PendingCheck | undefined;
      if (!pending) return sendResponse({ ok: false, reason: "unknown-check" });
      await deliverResult(message.checkId, pending, message.payload);
      await chrome.alarms.clear(alarmName(message.checkId));
      await chrome.storage.session.remove([key, ...(pending.amazonTabId ? [amazonTabKey(pending.amazonTabId)] : [])]);
      sendResponse({ ok: true });
    })().catch((error: unknown) => {
      console.error("Failed to deliver KU result", error);
      sendResponse({ ok: false });
    });
    return true;
  }
});
