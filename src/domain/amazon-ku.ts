/**
 * Kindle+ detection for Amazon product pages.
 *
 * The subscription was renamed from Kindle Unlimited to Kindle+. Product pages
 * can still use either name, and Amazon's offer widget ids still say
 * KINDLE_UNLIMITED. Match both.
 *
 * Amazon varies the buybox by account state:
 * - Subscriber: "Included with Kindle+" / "Included with kindle unlimited" / "$0.00 to buy after credits"
 * - Non-subscriber: `#Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop` with a Kindle+ or Kindle Unlimited logo
 *   and copy like "Unlimited reading" / "Read and Listen for Free"
 *
 * Prime Reading upsell alone is not Kindle+.
 */

const KINDLE_PLUS_NAME = String.raw`kindle\s*(?:\+|plus|unlimited)`;

export const KU_TEXT_PATTERNS: RegExp[] = [
  new RegExp(String.raw`included\s+with\s+${KINDLE_PLUS_NAME}`, 'i'),
  new RegExp(String.raw`free\s+with\s+${KINDLE_PLUS_NAME}`, 'i'),
  // Kindle+ CTA; negative lookahead avoids Prime Reading's "...for free with Prime"
  /read\s+(?:and\s+listen\s+)?for\s+free(?!\s+with\s+prime)/i,
  /unlimited\s+reading/i,
  /\$0\.00\s+to\s+buy\s+after\s+credits/i,
  new RegExp(String.raw`\$0\.00\s+(?:to\s+buy\s+)?(?:with|after)\s+${KINDLE_PLUS_NAME}`, 'i'),
  new RegExp(KINDLE_PLUS_NAME, 'i'),
];

/** Offer/buybox regions — keep scoped so related-book promos do not count. */
export const OFFER_SELECTOR_LIST = [
  '#buybox',
  '#desktop_buybox',
  '#Unified-Buybox-Container',
  '#Books-Buybox',
  '#CombinedBuybox',
  '#combinedBuyBox',
  '#buyBoxAccordion',
  '#tmmSwatches',
  '#formats',
  '#tmm-grid-swatch-KINDLE',
  '#mediaTab_content_landing',
  '#digitalDashHighProminenceBadge',
  '#kindleUnlimitedBadge',
  '#Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop',
  '#kuUpsell_desktop_feature_div',
  '#kuUpsellAccordionRow_desktop_content',
  "[data-a-expander-name='kindleUnlimited']",
  "[data-csa-c-content-id*='kuUpsell']",
  "[data-csa-c-content-id*='kuUpsellAccordion']",
  "[id*='kindleUnlimited']",
  "[id*='KINDLE_UNLIMITED']",
  "[id*='kindlePlus']",
  "[id*='KINDLE_PLUS']",
  "[id*='kuUpsell']",
  "[class*='kindleUnlimited']",
  "[class*='kindlePlus']",
  "[class*='kindle-plus']",
  "[class*='ku-promo']",
];

export const OFFER_SELECTORS = OFFER_SELECTOR_LIST.join(',');

const KU_STRUCTURAL_SELECTORS = [
  '#Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop',
  '#kuUpsell_desktop_feature_div',
  '#kuUpsellAccordionRow_desktop_content',
  '#kindleUnlimitedBadge',
  "[data-a-expander-name='kindleUnlimited']",
].join(',');

function isVisiblyRenderable(node: Element): boolean {
  if (!(node instanceof HTMLElement)) return false;
  const style = getComputedStyle(node);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function visibleText(node: HTMLElement): string {
  if (!isVisiblyRenderable(node)) return '';
  const text = node.innerText || node.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

function addPatternEvidence(evidence: Set<string>, text: string): void {
  if (!text) return;
  for (const pattern of KU_TEXT_PATTERNS) {
    const match = text.match(pattern)?.[0];
    if (match) evidence.add(match);
  }
}

function offerRoots(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(OFFER_SELECTORS)];
}

/**
 * Collect KU evidence from the product offer area only.
 * Structural KU widgets count even when the subscriber-facing phrase is absent.
 */
export function collectKuEvidence(root: ParentNode = document): string[] {
  const evidence = new Set<string>();

  for (const node of offerRoots(root)) {
    addPatternEvidence(evidence, visibleText(node));

    for (const img of node.querySelectorAll('img')) {
      if (!isVisiblyRenderable(img)) continue;
      const alt = img.getAttribute('alt') ?? '';
      const src = img.getAttribute('src') ?? '';
      if (/kindle\s*(?:\+|plus|unlimited)/i.test(alt) || /kindle[-_]?unlimited|kindle[-_]?plus/i.test(src)) {
        evidence.add(alt.trim() || 'Kindle+ logo');
      }
    }

    for (const icon of node.querySelectorAll<HTMLElement>(
      "[class*='a-icon-kindle-unlimited'], [class*='kindle-unlimited'], [class*='a-icon-kindle-plus'], [class*='kindle-plus']"
    )) {
      if (isVisiblyRenderable(icon)) {
        evidence.add('Kindle+ icon');
        break;
      }
    }
  }

  for (const node of root.querySelectorAll<HTMLElement>(KU_STRUCTURAL_SELECTORS)) {
    if (isVisiblyRenderable(node)) {
      evidence.add('Kindle+ offer widget');
      break;
    }
  }

  return [...evidence];
}

/** True when the buybox/offer chrome looks loaded enough to decide. */
export function offerAreaReady(root: ParentNode = document): boolean {
  const candidates = root.querySelectorAll<HTMLElement>(
    [
      '#buybox',
      '#desktop_buybox',
      '#Unified-Buybox-Container',
      '#tmmSwatches',
      '#formats',
      '#Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop',
      '#Kibbo-KINDLE_ALC-Desktop',
      '#kindleALCAccordionRow_desktop_content',
    ].join(',')
  );

  return [...candidates].some((node) => {
    if (!isVisiblyRenderable(node)) return false;
    return Boolean(visibleText(node) || node.querySelector('img, button, a, input'));
  });
}
