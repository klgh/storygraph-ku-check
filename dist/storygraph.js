(() => {
  const ROOT_ID = "sg-ku-checker-root";
  let localCheckTimer;
  let resultPollTimer;
  let activeCheckId;
  let hydratedBookKey;
  const clean = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
  const findLabeledValue = (label) => {
    const match = document.body.innerText.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
    return clean(match?.[1]) || undefined;
  };
  const parseOgTitle = () => {
    const raw = clean(document.querySelector('meta[property="og:title"]')?.content).replace(/\s*\|\s*The StoryGraph\s*$/i, "");
    if (!raw) return {};
    const byMatch = raw.match(/^(.*?)\s+by\s+(.+)$/i);
    return byMatch ? { title: clean(byMatch[1]), author: clean(byMatch[2]) } : { title: raw };
  };
  const findBookHeading = (expectedTitle) => {
    const headings = [...document.querySelectorAll("h1, h2, h3")];
    const expected = clean(expectedTitle).toLowerCase();
    if (expected) {
      const exact = headings.find((heading) => clean(heading.textContent).toLowerCase() === expected);
      if (exact) return exact;
    }
    return headings.find((heading) => {
      const text = clean(heading.textContent);
      return text && !/^(editions|description|community reviews|content warnings)$/i.test(text);
    }) ?? null;
  };
  const findAuthorNearHeading = (heading) => {
    const local = heading?.parentElement?.querySelector('a[href*="/authors/"]');
    const localText = clean(local?.textContent);
    return localText || clean(document.querySelector('a[href*="/authors/"], [rel="author"]')?.textContent);
  };
  const extractBook = () => {
    const metadata = parseOgTitle();
    const heading = findBookHeading(metadata.title);
    const title = metadata.title || clean(heading?.textContent);
    const author = metadata.author || findAuthorNearHeading(heading);
    const isbn = findLabeledValue("ISBN/UID")?.match(/[0-9Xx-]{10,17}/)?.[0]?.replace(/-/g, "");
    return title && author ? { title, author, isbn, storygraphUrl: location.href } : null;
  };
  const statusLabel = (result) => ({
    AVAILABLE: "Available on Kindle Unlimited",
    NOT_DETECTED: "Kindle Unlimited was not detected",
    UNCERTAIN: "Possible match; verify on Amazon",
    NO_MATCH: "No matching Kindle result found",
    TIMED_OUT: "Amazon check timed out — try again"
  })[result.status] ?? "Kindle Unlimited status unknown";
  const sameBook = (a, b) => clean(a.title).toLowerCase() === clean(b.title).toLowerCase() && clean(a.author).toLowerCase() === clean(b.author).toLowerCase();
  const bookKey = (book) => `${clean(book.title).toLowerCase()}::${clean(book.author).toLowerCase()}`;

  const applyResult = (result) => {
    const currentBook = extractBook();
    if (!currentBook || !sameBook(currentBook, result.book)) return;
    clearTimeout(localCheckTimer);
    clearTimeout(resultPollTimer);
    activeCheckId = undefined;
    render(result);
  };

  const startResultPolling = (checkId) => {
    clearTimeout(resultPollTimer);
    const startedAt = Date.now();
    const poll = async () => {
      if (activeCheckId !== checkId) return;
      const response = await chrome.runtime.sendMessage({ type: "GET_CHECK_RESULT", checkId }).catch(() => null);
      if (response?.result) {
        applyResult(response.result);
        return;
      }
      if (Date.now() - startedAt < 50000) resultPollTimer = setTimeout(poll, 1000);
    };
    void poll();
  };

  const render = (result) => {
    const book = extractBook();
    if (!book) return;
    document.getElementById(ROOT_ID)?.remove();
    const root = document.createElement("section");
    root.id = ROOT_ID;
    root.style.cssText = "margin:12px 0;padding:12px;border:1px solid currentColor;border-radius:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap";
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
      const response = await chrome.runtime.sendMessage({ type: "CHECK_BOOK", payload: book }).catch(() => null);
      if (!response?.ok || !response.checkId) {
        button.disabled = false;
        status.textContent = "Unable to start check";
        return;
      }
      activeCheckId = response.checkId;
      startResultPolling(activeCheckId);
      clearTimeout(localCheckTimer);
      localCheckTimer = setTimeout(() => {
        button.disabled = false;
        status.textContent = "Amazon has not responded — try again";
      }, 50000);
    });
    root.append(button);
    findBookHeading(book.title)?.insertAdjacentElement("afterend", root);

    if (!result) {
      const key = bookKey(book);
      if (hydratedBookKey !== key) {
        hydratedBookKey = key;
        void chrome.runtime.sendMessage({ type: "GET_CACHED_RESULT", book }).then((response) => {
          if (response?.result && sameBook(extractBook() ?? book, response.result.book)) render(response.result);
        }).catch(() => undefined);
      }
    }
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== "KU_RESULT") return;
    if (activeCheckId && message.checkId !== activeCheckId) return;
    applyResult(message.payload);
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !activeCheckId) return;
    const change = changes[`delivery:v7:${activeCheckId}`];
    if (change?.newValue) applyResult(change.newValue);
  });

  let previousUrl = location.href;
  let renderTimer;
  new MutationObserver(() => {
    if (previousUrl !== location.href) {
      previousUrl = location.href;
      hydratedBookKey = undefined;
    }
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      if (!document.getElementById(ROOT_ID)) render();
    }, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
  render();
})();
