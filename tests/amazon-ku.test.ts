import { afterEach, describe, expect, it } from 'vitest';
import { collectKuEvidence, offerAreaReady } from '../src/domain/amazon-ku';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('collectKuEvidence', () => {
  it('detects subscriber Included with Kindle Unlimited copy in the buybox', () => {
    document.body.innerHTML = `
      <div id="buybox">
        <img alt="Kindle Unlimited" src="https://m.media-amazon.com/images/I/ku.svg" />
        <span>Included with kindle unlimited</span>
        <span>$0.00 to buy after credits</span>
      </div>
      <div id="sp_detail">Related: Also on Kindle Unlimited — ignore me</div>
    `;

    const evidence = collectKuEvidence(document);
    expect(evidence.some((item) => /included with kindle unlimited/i.test(item))).toBe(true);
    expect(evidence).toContain('Kindle Unlimited');
  });

  it('detects the non-subscriber KU upsell widget without Included copy', () => {
    document.body.innerHTML = `
      <div id="buybox">
        <div id="Kibbo-KINDLE_UNLIMITED_UPSELL-Desktop">
          <div id="kuUpsell_desktop_feature_div">
            <img alt="Kindle Unlimited" src="https://m.media-amazon.com/images/I/21q7RgWPn4L.svg" />
            <span class="ku-promo-message">Unlimited reading. Over 5 million titles.</span>
            <a>Read and Listen for Free</a>
          </div>
        </div>
        <div id="Kibbo-KINDLE_PRIME_READING_UPSELL-Desktop">
          This title is also available to read and listen for free with Prime.
        </div>
      </div>
    `;

    const evidence = collectKuEvidence(document);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.some((item) => /unlimited reading|read and listen for free|Kindle Unlimited/i.test(item))).toBe(
      true
    );
    expect(evidence).toContain('Kindle Unlimited offer widget');
  });

  it('detects the Kindle format swatch KU icon', () => {
    document.body.innerHTML = `
      <div id="tmmSwatches">
        <div id="tmm-grid-swatch-KINDLE">
          <span>Kindle</span>
          <span class="a-color-price">$0.00</span>
          <i class="a-icon a-icon-kindle-unlimited-headphones a-icon-small"></i>
          <span>or $1.99 to buy</span>
        </div>
      </div>
    `;

    expect(collectKuEvidence(document)).toContain('Kindle Unlimited icon');
  });

  it('ignores KU mentions outside the offer area', () => {
    document.body.innerHTML = `
      <div id="buybox">
        <button>Buy now for $9.99</button>
      </div>
      <div class="carousel">
        <span>Included with kindle unlimited</span>
        <img alt="Kindle Unlimited" src="https://example.com/other-book-ku.svg" />
      </div>
    `;

    expect(collectKuEvidence(document)).toEqual([]);
  });

  it('does not treat Prime-only upsell as KU', () => {
    document.body.innerHTML = `
      <div id="buybox">
        <div id="Kibbo-KINDLE_PRIME_READING_UPSELL-Desktop">
          This title is also available to read and listen for free with Prime.
        </div>
        <button>Buy now for $4.99</button>
      </div>
    `;

    expect(collectKuEvidence(document)).toEqual([]);
  });
});

describe('offerAreaReady', () => {
  it('is true when a visible buybox has content', () => {
    document.body.innerHTML = `<div id="buybox"><button>Buy now</button></div>`;
    expect(offerAreaReady(document)).toBe(true);
  });

  it('is false when the offer shell is missing', () => {
    document.body.innerHTML = `<h1 id="productTitle">A Book</h1>`;
    expect(offerAreaReady(document)).toBe(false);
  });
});
