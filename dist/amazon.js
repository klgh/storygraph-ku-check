(() => {
  const normalizeText = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const KU_PATTERNS = [/included\s+with\s+kindle\s+unlimited/i,/kindle\s+unlimited/i,/read\s+for\s+free/i,/\$0\.00\s+(?:to\s+buy\s+)?(?:with|after)\s+kindle\s+unlimited/i];
  const OFFER_SELECTORS = "#buybox,#buyBoxAccordion,#tmmSwatches,#formats,#mediaTab_content_landing,#digitalDashHighProminenceBadge,#kindleUnlimitedBadge,[data-a-expander-name='kindleUnlimited'],[data-csa-c-content-id*='kindle'],[id*='kindleUnlimited'],[class*='kindleUnlimited']";
  const visibleText = (node) => {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return "";
    return node.innerText?.replace(/\s+/g, " ").trim() ?? "";
  };
  const collectEvidence = () => {
    const evidence = new Set();
    for (const node of document.querySelectorAll(OFFER_SELECTORS)) {
      const text = visibleText(node);
      if (!text) continue;
      for (const pattern of KU_PATTERNS) {
        const match = text.match(pattern)?.[0];
        if (match) evidence.add(match);
      }
    }
    return [...evidence];
  };
  const productTitle = () => document.querySelector("#productTitle, #ebooksProductTitle, h1")?.innerText.trim();
  const productAuthor = () => [...document.querySelectorAll("#bylineInfo a, .author a, a.contributorNameID")].map((node) => node.innerText.trim()).filter(Boolean).join(" ");
  const appendPayload = (url, book, checkId) => {
    const target = new URL(url, location.origin);
    target.searchParams.set("sgku_book", encodeURIComponent(JSON.stringify(book)));
    target.searchParams.set("sgku_check", checkId);
    return target.toString();
  };
  const scoreResult = (result, book) => {
    const title = normalizeText(result.querySelector("h2")?.innerText ?? "");
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
  };
  const navigateToBestSearchResult = (book, checkId) => {
    const results = [...document.querySelectorAll('[data-component-type="s-search-result"]')]
      .filter((element) => !element.innerText.toLowerCase().includes("sponsored"))
      .map((element) => ({ element, score: scoreResult(element, book) }))
      .sort((a, b) => b.score - a.score);
    const best = results[0];
    if (!best || best.score < 0.68) return false;
    const link = best.element.querySelector('h2 a[href*="/dp/"], a[href*="/dp/"]');
    if (!link?.href) return false;
    location.href = appendPayload(link.href, book, checkId);
    return true;
  };
  const meaningfulTokens = (value) => normalizeText(value).split(" ").filter((token) => token.length > 1 && !["a", "an", "the", "novel", "book", "edition", "author"].includes(token));
  const tokenCoverage = (expected, actual) => {
    if (!expected.length) return 0;
    const actualSet = new Set(actual);
    return expected.filter((token) => actualSet.has(token)).length / expected.length;
  };
  const titleMatchScore = (expectedValue, actualValue) => {
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
  };
  const authorMatchScore = (expectedValue, actualValue) => {
    const expected = normalizeText(expectedValue).replace(/\b(author|editor|illustrator|narrator|contributor)\b/g, " ").replace(/\s+/g, " ").trim();
    const actual = normalizeText(actualValue).replace(/\b(author|editor|illustrator|narrator|contributor|visit|amazon|page)\b/g, " ").replace(/\s+/g, " ").trim();
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
  };
  const productMatchConfidence = (book) => {
    const titleScore = titleMatchScore(book.title, productTitle() ?? "");
    const authorScore = authorMatchScore(book.author, productAuthor());
    return { confidence: titleScore * 0.78 + authorScore * 0.22, titleScore, authorScore };
  };
  const productMatchesBook = (book) => {
    const { confidence, titleScore, authorScore } = productMatchConfidence(book);
    return titleScore >= 0.78 && authorScore >= 0.5 && confidence >= 0.75;
  };
  const sendResult = async (book, checkId, status, evidence) => {
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete("sgku_book");
    cleanUrl.searchParams.delete("sgku_check");
    const message = { type: "AMAZON_RESULT", checkId, payload: { book, status, amazonUrl: cleanUrl.toString(), matchedTitle: productTitle(), evidence, checkedAt: Date.now() } };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await chrome.runtime.sendMessage(message).catch(() => null);
      if (response?.ok) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.error("Unable to return Kindle Unlimited result to the extension");
  };
  const waitForPage = (book, checkId) => {
    const isSearchPage = location.pathname === "/s";
    const startedAt = Date.now();
    const timeoutMs = 22000;
    let readyPolls = 0;
    const check = () => {
      if (isSearchPage) {
        if (navigateToBestSearchResult(book, checkId)) return;
        if (Date.now() - startedAt < timeoutMs) return setTimeout(check, 500);
        void sendResult(book, checkId, "NO_MATCH", []);
        return;
      }
      const pageLooksReady = Boolean(document.querySelector("#productTitle, #ebooksProductTitle"));
      if (pageLooksReady && !productMatchesBook(book)) {
        const match = productMatchConfidence(book);
        void sendResult(book, checkId, "UNCERTAIN", [`Amazon match confidence ${match.confidence.toFixed(2)} (title ${match.titleScore.toFixed(2)}, author ${match.authorScore.toFixed(2)})`]);
        return;
      }
      const evidence = collectEvidence();
      if (evidence.length) {
        void sendResult(book, checkId, "AVAILABLE", evidence);
        return;
      }
      const offerAreaReady = Boolean(document.querySelector(OFFER_SELECTORS));
      if (pageLooksReady && offerAreaReady) readyPolls += 1;
      if (readyPolls >= 8 || Date.now() - startedAt >= timeoutMs) {
        void sendResult(book, checkId, "NOT_DETECTED", []);
        return;
      }
      setTimeout(check, 500);
    };
    check();
  };
  const initialize = async () => {
    const params = new URLSearchParams(location.search);
    const encodedBook = params.get("sgku_book");
    const checkId = params.get("sgku_check");
    if (encodedBook && checkId) {
      try {
        waitForPage(JSON.parse(decodeURIComponent(encodedBook)), checkId);
        return;
      } catch (error) {
        console.error("Invalid StoryGraph KU payload", error);
      }
    }
    const response = await chrome.runtime.sendMessage({ type: "GET_AMAZON_CHECK" }).catch(() => null);
    if (response?.ok && response.book && response.checkId) waitForPage(response.book, response.checkId);
  };
  void initialize();
})();
