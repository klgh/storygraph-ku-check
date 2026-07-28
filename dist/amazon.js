(() => {
  const normalizeText = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const STRONG_KU_PATTERNS = [/included\s+with\s+kindle\s+unlimited/i,/read\s+(?:and\s+listen\s+)?for\s+free\s+with\s+kindle\s+unlimited/i,/read\s+for\s+free/i,/\$0\.00\s+(?:to\s+buy\s+)?(?:with|after)\s+kindle\s+unlimited/i,/borrow\s+for\s+free\s+with\s+kindle\s+unlimited/i];
  const KU_BADGE_PATTERN = /kindle[\s_-]*unlimited/i;
  const OFFER_SELECTORS = "#buybox,#buyBoxAccordion,#desktop_buybox,#rightCol,#tmmSwatches,#tmm-grid-swatch-KINDLE,#formats,#mediaTab_content_landing,#digitalDashHighProminenceBadge,#kindleUnlimitedBadge,#kindle-unlimited,[data-a-expander-name='kindleUnlimited'],[data-csa-c-content-id*='kindle'],[data-csa-c-type*='kindle'],[id*='kindleUnlimited'],[id*='kindle-unlimited'],[class*='kindleUnlimited'],[class*='kindle-unlimited'],[aria-label*='Kindle Unlimited' i],[title*='Kindle Unlimited' i],img[alt*='Kindle Unlimited' i],img[src*='kindle-unlimited' i],img[src*='kindleunlimited' i]";
  const visibleText = (node) => { const style = getComputedStyle(node); if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return ""; return node.innerText?.replace(/\s+/g, " ").trim() ?? ""; };
  const addPatternEvidence = (text, evidence) => { for (const pattern of STRONG_KU_PATTERNS) { const match = text.match(pattern)?.[0]; if (match) evidence.add(match); } };
  const collectEvidence = () => {
    const evidence = new Set();
    const bodyText = document.body?.innerText?.replace(/\s+/g, " ") ?? "";
    addPatternEvidence(bodyText, evidence);
    for (const node of document.querySelectorAll(OFFER_SELECTORS)) {
      const text = visibleText(node);
      if (text) { addPatternEvidence(text, evidence); if (KU_BADGE_PATTERN.test(text)) evidence.add("Kindle Unlimited offer"); }
      const attributes = [node.getAttribute("aria-label"),node.getAttribute("title"),node.getAttribute("alt"),node.getAttribute("src")].filter(Boolean);
      if (attributes.some((value) => KU_BADGE_PATTERN.test(value))) evidence.add("Kindle Unlimited badge");
    }
    return [...evidence];
  };
  const productTitle = () => document.querySelector("#productTitle, #ebooksProductTitle, h1")?.innerText.trim();
  const appendPayload = (url, book, checkId) => { const target = new URL(url, location.origin); target.searchParams.set("sgku_book", encodeURIComponent(JSON.stringify(book))); target.searchParams.set("sgku_check", checkId); return target.toString(); };
  const scoreResult = (result, book) => {
    const title = normalizeText(result.querySelector("h2")?.innerText ?? ""); const fullText = normalizeText(result.innerText ?? ""); const expectedTitle = normalizeText(book.title); const expectedAuthor = normalizeText(book.author); let score = 0;
    if (title === expectedTitle) score += 0.72; else if (title.startsWith(expectedTitle) || expectedTitle.startsWith(title)) score += 0.55; else if (title.includes(expectedTitle) || expectedTitle.includes(title)) score += 0.4;
    if (fullText.includes(expectedAuthor)) score += 0.23; if (result.querySelector('a[href*="/dp/"]')) score += 0.05; return score;
  };
  const navigateToBestSearchResult = (book, checkId) => {
    const results = [...document.querySelectorAll('[data-component-type="s-search-result"]')].filter((element) => !element.innerText.toLowerCase().includes("sponsored")).map((element) => ({element, score: scoreResult(element, book)})).sort((a,b) => b.score-a.score);
    const best = results[0]; if (!best || best.score < 0.68) return false; const link = best.element.querySelector('h2 a[href*="/dp/"], a[href*="/dp/"]'); if (!link?.href) return false; location.href = appendPayload(link.href, book, checkId); return true;
  };
  const sendResult = async (book, checkId, status, evidence) => {
    const cleanUrl = new URL(location.href); cleanUrl.searchParams.delete("sgku_book"); cleanUrl.searchParams.delete("sgku_check");
    const message = {type:"AMAZON_RESULT", checkId, payload:{book,status,amazonUrl:cleanUrl.toString(),matchedTitle:productTitle(),evidence,checkedAt:Date.now()}};
    for (let attempt=0; attempt<3; attempt+=1) { const response = await chrome.runtime.sendMessage(message).catch(() => null); if (response?.ok) return; await new Promise((resolve) => setTimeout(resolve,500)); }
    console.error("Unable to return Kindle Unlimited result to the extension");
  };
  const waitForPage = (book, checkId) => {
    const isSearchPage = location.pathname === "/s"; const startedAt = Date.now(); const timeoutMs = 30000; let finished = false; let observer;
    const finish = (status,evidence) => { if (finished) return; finished=true; observer.disconnect(); void sendResult(book,checkId,status,evidence); };
    const check = () => {
      if (finished) return;
      if (isSearchPage) { if (navigateToBestSearchResult(book,checkId)) return; if (Date.now()-startedAt >= timeoutMs) finish("NO_MATCH",[]); return; }
      const pageLooksReady = Boolean(document.querySelector("#productTitle, #ebooksProductTitle") || document.querySelector('link[rel="canonical"][href*="/dp/"]'));
      const evidence = collectEvidence(); if (pageLooksReady && evidence.length > 0) { finish("AVAILABLE",evidence); return; }
      if (pageLooksReady && Date.now()-startedAt >= timeoutMs) finish("NOT_DETECTED",[]);
    };
    observer = new MutationObserver(check); observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","aria-label","title","alt","src"]});
    const poll = setInterval(() => { check(); if (finished) clearInterval(poll); },500); check();
  };
  const initialize = async () => {
    const params = new URLSearchParams(location.search); const encodedBook = params.get("sgku_book"); const checkId = params.get("sgku_check");
    if (encodedBook && checkId) { try { waitForPage(JSON.parse(decodeURIComponent(encodedBook)),checkId); return; } catch (error) { console.error("Invalid StoryGraph KU payload",error); } }
    const response = await chrome.runtime.sendMessage({type:"GET_AMAZON_CHECK"}).catch(() => null); if (response?.ok && response.book && response.checkId) waitForPage(response.book,response.checkId);
  };
  void initialize();
})();
