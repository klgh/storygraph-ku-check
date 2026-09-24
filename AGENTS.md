# AGENTS.md

## Project overview

Chrome Manifest V3 extension that checks whether a book on StoryGraph is included with Kindle Unlimited. It has no
toolbar action and no popup. On a StoryGraph book page it injects a check panel. Clicking Check opens a background
Amazon tab, reads the Kindle search or product page, then shows the result back on StoryGraph.

Stack: TypeScript, Vite 8 (programmatic build only), Vitest 5 with jsdom, `@types/chrome`. Package manager is npm.
`package-lock.json` is the lockfile. There is no ESLint, Prettier, or GitHub Actions workflow.

## Setup commands

- Install dependencies: `npm install`
- Run tests: `npm test`
- Typecheck: `npm run typecheck`
- Production build: `npm run build`
- Rebuild on source changes: `npm run dev`

`vite.config.ts` is only the Vitest config. The extension build does not use it. `scripts/build.mjs` calls the Vite API
with `configFile: false` and emits IIFE bundles into `dist/`:

- `src/background/service-worker.ts` → `dist/service-worker.js`
- `src/content/storygraph.ts` → `dist/storygraph.js`
- `src/content/amazon.ts` → `dist/amazon.js`

The first entry copies the root `manifest.json` into `dist/`. An unpacked load needs that manifest beside the three
built scripts. `dist/` is gitignored.

Load the built extension in Chrome as an unpacked extension. There is no action button. Open a book on
`https://app.thestorygraph.com` and use the injected Check panel. `minimum_chrome_version` is 130.

## Layout

- `manifest.json` — permissions, host permissions, and script entry names. Permissions are `storage` and `alarms`. Hosts
  are `https://app.thestorygraph.com/*` and `https://www.amazon.com/*`.
- `src/content/storygraph.ts` — finds the book, paints the panel, sends `CHECK_BOOK`.
- `src/content/storygraph-panel.ts` — panel copy and DOM. Styles come from `storygraph-panel.css?inline`.
- `src/content/amazon.ts` — Kindle search and product page. Search uses `pickBestSearchResult`; the product page is not
  scored again.
- `src/background/service-worker.ts` — starts the check, opens the Amazon tab, stores the result, and times out with an
  alarm.
- `src/domain/` — book types, StoryGraph extraction, Amazon search scoring, Kindle Unlimited evidence, text
  normalization.
- `src/shared/messages.ts` — message union between the page scripts and the service worker.
- `src/storage/cache.ts` — 24-hour result cache in `chrome.storage.local`.
- `tests/` — Vitest files named `*.test.ts`.
- `CHROMEWEBSTORE.md` — Chrome Web Store listing, permission justifications, and privacy answers.
- `PRIVACY.md` — privacy policy draft.

## Check behavior

Keep these constraints unless the task changes them:

- Check and Check again send `CHECK_BOOK` with `force: true`, so they always query Amazon again.
- The 24-hour cache is only for painting a previous result when the page loads. `TIMED_OUT` is not written to that
  cache.
- Each check also writes a delivery record so the StoryGraph page can read the result. Do not delete those records as
  part of the timeout path.
- Amazon opens in a background tab. The tab is closed when an `AMAZON_RESULT` arrives. A timeout can leave that tab
  open.
- The search-result score is the match gate. A strong search match navigates to the product page. A weak search becomes
  `NO_MATCH`. On the product page, Kindle Unlimited evidence becomes `AVAILABLE`; otherwise the result is
  `NOT_DETECTED`.
- `UNCERTAIN` exists on `KuStatus` and in panel copy. The Amazon script does not assign it.
- `extractStoryGraphBook` lives in `src/domain/storygraph-extract.ts`. Content script and tests import it from there.

## Testing instructions

- Run the suite: `npm test`
- Run one file: `npx vitest run tests/amazon-match.test.ts`
- Run by name: `npx vitest run -t "pickBestSearchResult"`
- Typecheck: `npm run typecheck`

Tests use jsdom. Domain and panel tests should not need a live Chrome instance. Add or update a test when behavior
changes. Assert the status, score, or visible copy, not private helpers.

There is no coverage script and no CI. Run `npm test` and `npm run typecheck` before treating a behavior change as done.

`vite.config.ts` must import `defineConfig` from `vitest/config`. Vite's own `defineConfig` does not include the `test`
option, so `npm run typecheck` fails if that import changes.

## Code style

- TypeScript `strict` and `noUncheckedIndexedAccess` are on. Do not use `any` to get a compile to pass.
- Match the quote and semicolon style of the file you are editing. The repo is mixed and has no formatter.
- Keep Chrome-specific code in the content scripts and service worker. Keep matching, extraction, and evidence rules in
  `src/domain/` so they can be tested.
- Extend `ExtensionMessage` in `src/shared/messages.ts` when adding a message. Do not invent a parallel message shape.
- Do not add a dependency for something the standard library or the existing Vite/Vitest setup already does.

## Build and deployment

`npm run build` writes `dist/`. Ship only the built extension files, not the repository.

Store listing text belongs in `CHROMEWEBSTORE.md`. Listing copy must describe what the user sees. Do not mention Chrome
APIs, the service worker, content scripts, or the cache implementation in store-facing text.

`PRIVACY.md` and the privacy section of `CHROMEWEBSTORE.md` are separate drafts. Update the one the task names, and do
not assume they already match.

## Security

- Do not widen `permissions` or `host_permissions` beyond the two sites above unless the task requires it.
- Do not add remote code, `eval`, or a broad `<all_urls>` match.
- Report vulnerabilities privately to the address in `SECURITY.md`. Do not open a public issue for a vulnerability.
- Do not commit secrets. This project has no API keys.

## Additional notes

- `.github/dependabot.yml` is a stub. `package-ecosystem` is empty, so Dependabot is not updating dependencies.
- `README.md` tells people to click an action button. The manifest has no `action`. Prefer the behavior in this file and
  in the source when they disagree.
