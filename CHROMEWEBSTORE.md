# Chrome Web Store Listing — StoryGraph Kindle+ Checker

> Last Updated: 2026-10-27

## Store Listing

**Extension Name** [REQUIRED] StoryGraph Kindle+ Checker

**Short Description** [REQUIRED] Check whether a StoryGraph book is included with Kindle+.

**Detailed Description** [REQUIRED]

Copy the plain text below into the store's detailed description field.

```text
Check Kindle+ availability while browsing books on StoryGraph. Click Check Kindle+ on a book page to look up the matching Kindle edition on Amazon.com and see the result on StoryGraph.

FEATURES
• Check a book directly from its StoryGraph page
• See whether the matching Amazon.com page shows a Kindle+ offer
• Open View on Amazon to confirm the edition and current offer
• See your previous result when you return to a book within 24 hours, or use Check again for a fresh lookup

HOW TO USE
1. Install the extension and open a book page on app.thestorygraph.com. Refresh the page if it was already open when you installed it.
2. Click Check Kindle+ in the panel on the book page.
3. Review the result and use View on Amazon, when available, to confirm it.

The check control appears on StoryGraph book pages. There is no toolbar button or popup.

BEFORE YOU CHECK
• Checks Amazon.com only. Other Amazon marketplaces are not supported.
• “Kindle+ was not detected” does not prove that the book is unavailable. Confirm the edition and current offer on Amazon.
• Availability can change, and an incorrect edition can sometimes be selected.
• A check can take up to about 45 seconds. It opens Amazon in a background tab that closes when a result arrives. A timeout can leave that tab open.

PRIVACY
No account is required. The extension has no analytics or advertising and sends no data to the developer. It reads the title, author, and ISBN from the StoryGraph book page. Running a check sends search terms (ISBN, or title and author) to Amazon.com.

Results are saved on your device. Previous results are shown for up to 24 hours; some saved check records remain until you uninstall the extension. Uninstalling removes stored data.

Privacy policy: https://github.com/klgh/storygraph-ku-check/blob/main/PRIVACY.md

SITE ACCESS
StoryGraph access lets the extension identify the book and show its Check panel. Amazon.com access lets it look up the book and read the Kindle+ offer. On-device storage remembers results, and a timer ends checks that take too long.

SUPPORT
Report an incorrect match, ask a question, or suggest a feature: https://github.com/klgh/storygraph-ku-check/issues

This project is not affiliated with, endorsed by, or sponsored by StoryGraph or Amazon.
```

**Category** [REQUIRED] Shopping

**Single Purpose** [REQUIRED] Checks whether a book page on StoryGraph appears to be included with Kindle+.

**Primary Language** [REQUIRED] English

## Graphics & Assets

| Asset                          | Dimensions | Status | Filename |
| ------------------------------ | ---------- | ------ | -------- |
| Store Icon [REQUIRED]          | 128×128 PNG | Ready | assets/icon128.png |
| Store image 1: overview        | 1280×800 PNG | Ready | assets/store-overview.png |
| Store image 2: start a check   | 1280×800 PNG | Ready | assets/store-check.png |
| Store image 3: confirm offer   | 1280×800 PNG | Ready | assets/store-confirm.png |
| Small Promo Tile [RECOMMENDED] | 440×280 | Not created | |
| Marquee Promo Tile             | 1400×560 | Not created | |

Upload `assets/icon128.png` in the store dashboard. The same file is also the 128px icon in the extension package.
`assets/icon16.png`, `assets/icon32.png`, and `assets/icon48.png` are the smaller package icons.

### Store Image Order

1. `assets/store-overview.png` — Lead with the reader benefit and an enlarged available result on a StoryGraph book page.
2. `assets/store-check.png` — Show where to click Check Kindle+ on the book page.
3. `assets/store-confirm.png` — Highlight View on Amazon and explain confirming the matching edition and current offer.

These are promotional compositions made from the original screenshots with the built-in image-generation tool.
Original captures remain in `assets/Screenshot1.png` through `assets/Screenshot4.png` for reference. The images illustrate
previous checks; they do not promise that the example books are currently included with Kindle+.

Design briefs and generation prompts are saved in `assets/store-images.md`. Keep the real panel text and controls
consistent with the extension when refreshing these images. Do not imply affiliation with StoryGraph or Amazon.

## Permissions Justification

Copy these into the Chrome Web Store dashboard fields for each permission.

| Permission                      | Type             | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| storage                         | permissions      | Saves Kindle+ check results on the user’s device. A finished result (book title, author, optional ISBN, result, Amazon page used, and time of the check) is kept for 24 hours so returning to the same book can show the last answer without opening Amazon again. Timeouts are not kept in that 24-hour memory. Each check’s result, including a timeout, is also kept until the extension is uninstalled so the StoryGraph page can show the outcome if the user leaves the page while Amazon is still loading. A check in progress is kept only until that check finishes or times out. Nothing is synced across browsers or sent to the developer. Clicking Check again always looks the book up on Amazon again. |
| alarms                          | permissions      | A check opens Amazon and waits for a result. If Amazon does not finish in time, an alarm ends the wait after about 45 seconds and the StoryGraph page shows that the check timed out instead of remaining on “Checking” indefinitely.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| https://app.thestorygraph.com/* | host_permissions | This permission is only for StoryGraph book pages. It is used to read the title, author, and ISBN of the book the user is viewing, and to show the Check Kindle+ control and status on that page. It is not used on other websites.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| https://www.amazon.com/*        | host_permissions | After the user clicks Check Kindle+, the extension opens an Amazon Kindle search in a background tab (ISBN when available, otherwise title and author) and reads the matching product page to see whether Kindle+ is offered. That tab is closed when the check finishes. Product and search URLs on Amazon vary, so access is limited to amazon.com rather than a single path. It is not used on other shopping sites.                                                                                                                                                                                                                                                                                      |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

The extension reads book details from the page the user is viewing and stores check results on the device. It does not
send data to the developer. Running a check opens Amazon, so Amazon receives a normal page request that includes the
search terms for that book.

| Data Type                    | Collected? | Transmitted Off-Device?                                                    | Purpose                                                                                                                                                                                                                                                                                                                  | Shared with Third Parties?                                                                                              |
| ---------------------------- | ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Personally identifiable info | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Health info                  | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Financial info               | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Authentication info          | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Personal communications      | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Location                     | No         | No                                                                         | —                                                                                                                                                                                                                                                                                                                        | —                                                                                                                       |
| Web history                  | No         | No                                                                         | The extension does not record browsing history. It only uses the StoryGraph book page the user already has open and the Amazon page opened for that check.                                                                                                                                                               | —                                                                                                                       |
| User activity                | Yes        | No                                                                         | Stores that the user checked a book and what the result was. The last finished result for a book stays on the device for 24 hours so a return visit can reuse it. Timeouts are excluded from that 24-hour memory. The result of each check, including a timeout, stays on the device until the extension is uninstalled. | No                                                                                                                      |
| Website content              | Yes        | Yes — only to Amazon, and only when the user clicks Check Kindle+ | Reads title, author, and ISBN from the StoryGraph book page. Opens Amazon with those search terms and reads Kindle+ offer text from the matching product page.                                                                                                                                                  | No. The developer does not share data. Amazon receives the search as a normal visit the user started by clicking Check. |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED] https://github.com/klgh/storygraph-ku-check/blob/main/PRIVACY.md

The page is public and matches this policy. Paste that URL into the dashboard.

### Privacy policy draft (to host)

Privacy Policy for StoryGraph Kindle+ Checker

Last updated: 2026-10-27

This extension is not affiliated with StoryGraph or Amazon.

What Data We Collect

When you open a StoryGraph book page, the extension reads the book title, author, and ISBN shown on that page so it can
identify the book.

When you click Check Kindle+, the extension uses those details to look the book up on Amazon and reads whether
Kindle+ appears to be offered on the matching product page.

How Data Is Stored

The last finished check for a book (title, author, optional ISBN, result, Amazon page used, and time of the check) is
stored on your device for 24 hours so opening that book again can show the last answer. Timeouts are not kept in that
24-hour memory.

The result of each check, including a timeout, is stored on your device until you uninstall the extension, so the
StoryGraph page can show the outcome if you leave the page while Amazon is still loading.

A check in progress is stored only until that check finishes or times out.

This data is not synced to other browsers or sent to the developer.

How Data Is Used

Book details are used only to look up Kindle+ availability and to show the result on the StoryGraph page you
are viewing. Clicking Check again looks the book up on Amazon again.

Third-Party Services

The extension does not use analytics, advertising, or accounts.

Checking a book opens Amazon in a background tab and closes that tab when the check finishes. Amazon then receives a
normal page request that includes the search terms (ISBN, or title and author). Amazon’s handling of that visit is
covered by Amazon’s own privacy policy: https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ

Data Sharing

The developer does not sell or share your data. The only third-party site involved is Amazon, and only because you asked
the extension to look the book up there.

Data Retention and Deletion

The 24-hour memory expires on its own. Other saved results stay until you uninstall the extension. Uninstalling removes
all stored data.

Changes to This Policy

If data practices change, this policy will be updated and the Last updated date will change.

Contact

Privacy questions: kaleighscruggs@gmail.com https://github.com/klgh/storygraph-ku-check/issues

## Distribution

**Visibility**: Public **Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED] Kaleigh Scruggs

**Contact Email** [REQUIRED] kaleighscruggs@gmail.com

**Support URL / Email** [RECOMMENDED] https://github.com/klgh/storygraph-ku-check/issues

**Homepage URL** [RECOMMENDED] https://github.com/klgh/storygraph-ku-check

## Listing Update History

- 2026-10-27 — Renamed Kindle Unlimited to Kindle+ in the extension name, panel, listing, and privacy policy. Promotional screenshots still show the previous name.
- 2026-10-19 — Simplified the listing, clarified Amazon.com support and result limitations, corrected timeout and storage wording, and added a README installation link and usage guide. No extension version change.

## Version History

| Version | Date       | Changes                                                                                                                                                                                    | Status |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 0.0.0.1 | 2026-09-24 | Initial release. Returning to a book within 24 hours shows the last result. Check again always looks the book up on Amazon again, in a background tab that closes when the check finishes. | Draft  |

## Review Notes

This section is for submission prep, not the public listing.

### Applying this listing update

1. Update the detailed description using the plain text in Store Listing above. The short description remains the current manifest description.
2. Upload the revised store images in the order listed in Graphics & Assets. Leave promotional PNGs out of the extension zip.
3. Review the installed extension's behavior and the live privacy policy before submitting the listing update.
4. These changes update documentation and promotional assets only. If also submitting an extension release, run `npm run build` and zip the files inside `dist/`, not the repository.

### Known Issues / Limitations

- The store name includes “StoryGraph” and “Kindle+.” The listing and privacy policy state there is no
  affiliation. Reviewers sometimes reject trademarked names; if that happens, rename to a descriptive form such as
  “Kindle+ check for StoryGraph.”
- Store images are 1280×800: `assets/store-overview.png`, `assets/store-check.png`, and `assets/store-confirm.png`. They still show “Kindle Unlimited” and need a refresh before the next listing upload. The build includes only package icons, not these promotional images.
- Privacy policy URL is live and matches the extension: https://github.com/klgh/storygraph-ku-check/blob/main/PRIVACY.md
- A check opens Amazon in a background tab. The tab closes when the check finishes. If the check times out, that tab can
  stay open.
- A check can take up to about 45 seconds.
- A wrong edition can be selected if Amazon’s first strong search result is not the same book.
- Amazon access is site-wide on amazon.com because search and product URLs vary. The Amazon script only completes a
  lookup when the user started a check from StoryGraph.
- The extension name and short description match `manifest.json` and are within the store limits of 75 and 132 characters.

### Rejection History

None yet.
