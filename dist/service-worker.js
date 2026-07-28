const normalizeText = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const cacheKey = (book) => `result:v9:${normalizeText(book.title)}:${normalizeText(book.author)}`;
const pendingKey = (checkId) => `pending:v9:${checkId}`;
const amazonTabKey = (tabId) => `amazon-tab:v9:${tabId}`;
const deliveryKey = (checkId) => `delivery:v9:${checkId}`;
const alarmName = (checkId) => `sgku-timeout:${checkId}`;

const getCached = async (book) => {
  const key = cacheKey(book);
  const values = await chrome.storage.local.get(key);
  const result = values[key];
  if (!result) return null;
  if (Date.now() - result.checkedAt <= 86400000) return result;
  await chrome.storage.local.remove(key);
  return null;
};

const buildAmazonSearchUrl = (book, checkId) => {
  const query = book.isbn || `${book.title} ${book.author}`;
  const payload = encodeURIComponent(JSON.stringify(book));
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=digital-text&sgku_book=${payload}&sgku_check=${encodeURIComponent(checkId)}`;
};

const deliverResult = async (checkId, pending, result) => {
  if (result.status !== "TIMED_OUT") await chrome.storage.local.set({ [cacheKey(result.book)]: result });
  await chrome.storage.local.set({ [deliveryKey(checkId)]: result });
  await chrome.tabs.sendMessage(pending.sourceTabId, { type: "KU_RESULT", payload: result, checkId }).catch(() => undefined);
};

const findCheckForAmazonTab = async (tabId) => {
  const mapping = await chrome.storage.session.get(amazonTabKey(tabId));
  const checkId = mapping[amazonTabKey(tabId)];
  if (!checkId) return null;
  const stored = await chrome.storage.session.get(pendingKey(checkId));
  const pending = stored[pendingKey(checkId)];
  return pending ? { checkId, pending } : null;
};

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith("sgku-timeout:")) return;
  const checkId = alarm.name.slice("sgku-timeout:".length);
  void (async () => {
    const stored = await chrome.storage.session.get(pendingKey(checkId));
    const pending = stored[pendingKey(checkId)];
    if (!pending) return;
    const result = {
      book: pending.book,
      status: "TIMED_OUT",
      amazonUrl: pending.amazonTabId ? (await chrome.tabs.get(pending.amazonTabId).catch(() => undefined))?.url : undefined,
      evidence: ["Amazon did not return a result before the extension timeout"],
      checkedAt: Date.now()
    };
    await deliverResult(checkId, pending, result);
    const keys = [pendingKey(checkId)];
    if (pending.amazonTabId) keys.push(amazonTabKey(pending.amazonTabId));
    await chrome.storage.session.remove(keys);
  })().catch(console.error);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_BOOK") {
    void (async () => {
      if (sender.tab?.id == null) throw new Error("StoryGraph tab unavailable");
      const cached = await getCached(message.payload);
      if (cached) {
        const checkId = `cached-${crypto.randomUUID()}`;
        await chrome.storage.local.set({ [deliveryKey(checkId)]: cached });
        await chrome.tabs.sendMessage(sender.tab.id, { type: "KU_RESULT", payload: cached, checkId }).catch(() => undefined);
        sendResponse({ ok: true, cached: true, checkId });
        return;
      }
      const checkId = crypto.randomUUID();
      const pending = { sourceTabId: sender.tab.id, book: message.payload, createdAt: Date.now() };
      await chrome.storage.session.set({ [pendingKey(checkId)]: pending });
      const amazonTab = await chrome.tabs.create({ url: buildAmazonSearchUrl(message.payload, checkId), active: true });
      if (amazonTab.id != null) {
        pending.amazonTabId = amazonTab.id;
        await chrome.storage.session.set({ [pendingKey(checkId)]: pending, [amazonTabKey(amazonTab.id)]: checkId });
      }
      await chrome.alarms.create(alarmName(checkId), { delayInMinutes: 0.75 });
      sendResponse({ ok: true, cached: false, checkId });
    })().catch((error) => { console.error(error); sendResponse({ ok: false }); });
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

  if (message.type === "GET_CACHED_RESULT") {
    void (async () => {
      const result = await getCached(message.book);
      sendResponse({ ok: true, result });
    })().catch(() => sendResponse({ ok: false, result: null }));
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
      const stored = await chrome.storage.session.get(pendingKey(message.checkId));
      const pending = stored[pendingKey(message.checkId)];
      if (!pending) return sendResponse({ ok: false, reason: "unknown-check" });
      await deliverResult(message.checkId, pending, message.payload);
      await chrome.alarms.clear(alarmName(message.checkId));
      const keys = [pendingKey(message.checkId)];
      if (pending.amazonTabId) keys.push(amazonTabKey(pending.amazonTabId));
      await chrome.storage.session.remove(keys);
      sendResponse({ ok: true });
    })().catch((error) => { console.error(error); sendResponse({ ok: false }); });
    return true;
  }
});
