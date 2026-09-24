import { afterEach, describe, expect, it } from 'vitest';
import type { BookIdentity } from '../src/domain/book';
import { MIN_SEARCH_RESULT_SCORE, pickBestSearchResult, scoreResult } from '../src/domain/amazon-match';

const book: BookIdentity = {
  title: 'Piranesi',
  author: 'Susanna Clarke',
  storygraphUrl: 'https://app.thestorygraph.com/books/piranesi',
};

function resultHtml(options: { title: string; author?: string; href?: string; sponsored?: boolean }): string {
  const href = options.href ?? 'https://www.amazon.com/dp/B08HQ5NB5W';
  return `
    <div data-component-type="s-search-result">
      ${options.sponsored ? '<span>Sponsored</span>' : ''}
      <h2><a href="${href}">${options.title}</a></h2>
      <div>${options.author ?? ''}</div>
    </div>
  `;
}

function mountResults(...cards: string[]): HTMLElement {
  document.body.innerHTML = cards.join('');
  return document.body;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('scoreResult', () => {
  it('scores an exact title, author, and Kindle product link at 1', () => {
    mountResults(resultHtml({ title: 'Piranesi', author: 'Susanna Clarke' }));
    const card = document.querySelector<HTMLElement>("[data-component-type='s-search-result']");
    expect(scoreResult(card!, book)).toBeCloseTo(1);
  });

  it('can accept a prefix title when the author and product link are present', () => {
    mountResults(resultHtml({ title: 'Piranesi: A Novel', author: 'Susanna Clarke' }));
    const card = document.querySelector<HTMLElement>("[data-component-type='s-search-result']");
    expect(scoreResult(card!, book)).toBeCloseTo(0.83);
    expect(scoreResult(card!, book)).toBeGreaterThanOrEqual(MIN_SEARCH_RESULT_SCORE);
  });

  it('rejects a loose title match without the author', () => {
    mountResults(resultHtml({ title: 'The Piranesi Papers' }));
    const card = document.querySelector<HTMLElement>("[data-component-type='s-search-result']");
    expect(scoreResult(card!, book)).toBeCloseTo(0.45);
    expect(scoreResult(card!, book)).toBeLessThan(MIN_SEARCH_RESULT_SCORE);
  });
});

describe('pickBestSearchResult', () => {
  it('returns the strongest non-sponsored result at or above the match threshold', () => {
    mountResults(
      resultHtml({
        title: 'A Different Book',
        author: 'Someone Else',
        href: 'https://www.amazon.com/dp/B00WRONG',
      }),
      resultHtml({ title: 'Piranesi', author: 'Susanna Clarke' })
    );

    const picked = pickBestSearchResult(document, book);
    expect(picked?.href).toContain('/dp/B08HQ5NB5W');
    expect(picked?.score).toBeGreaterThanOrEqual(MIN_SEARCH_RESULT_SCORE);
  });

  it('ignores sponsored cards even when the title matches', () => {
    mountResults(
      resultHtml({
        title: 'Piranesi',
        author: 'Susanna Clarke',
        href: 'https://www.amazon.com/dp/B00SPONSOR',
        sponsored: true,
      }),
      resultHtml({ title: 'Unrelated Novel', author: 'Other Author' })
    );

    expect(pickBestSearchResult(document, book)).toBeNull();
  });

  it('returns null when no card has a product link', () => {
    document.body.innerHTML = `
      <div data-component-type="s-search-result">
        <h2>Piranesi</h2>
        <div>Susanna Clarke</div>
      </div>
    `;

    expect(pickBestSearchResult(document, book)).toBeNull();
  });
});
