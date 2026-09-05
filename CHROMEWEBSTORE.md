# Chrome Web Store Listing — StoryGraph Kindle Unlimited Checker

> Last Updated: 2026-09-04

## Store Listing

**Extension Name** [REQUIRED]
StoryGraph Kindle Unlimited Checker

**Short Description** [REQUIRED]
Checks whether a StoryGraph book appears to be available through Kindle Unlimited.

**Detailed Description** [REQUIRED]
See if a book you are viewing on StoryGraph appears to be included with Kindle Unlimited, then open the matching Amazon page to confirm.

FEATURES
• Adds a Check Kindle Unlimited control on StoryGraph book pages
• Shows whether Kindle Unlimited was found, was not detected, or could not be matched
• Remembers a check on the same book for 24 hours so you do not have to look it up again
• Links to the Amazon page that was used for the result

HOW TO USE
1. Open a book page on StoryGraph (app.thestorygraph.com)
2. Click Check Kindle Unlimited
3. Review the status that appears on the StoryGraph page
4. Optionally open View on Amazon to confirm the listing yourself

PRIVACY
This extension does not have an account and does not send data to the developer. When you run a check, it reads the book title, author, and ISBN from the StoryGraph page you are viewing, opens Amazon in a new tab to look that book up, and stores the result on your device for 24 hours. Uninstalling the extension removes that stored data.

This project is not affiliated with, endorsed by, or sponsored by StoryGraph or Amazon.

PERMISSIONS
• Storage — saves recent check results on your device so a repeat check can reuse them
• Alarms — ends a check if Amazon does not respond so the page does not wait forever
• StoryGraph — needed to show the check control and read the book you are looking at
• Amazon — needed to look up that book and see whether Kindle Unlimited is offered

SUPPORT
Questions or problems: https://github.com/klgh/storygraph-ku-check/issues

Version 0.8.0 — After a strong Amazon search match, the product page is reported as available on Kindle Unlimited or not detected.

**Category** [REQUIRED]
Shopping

**Single Purpose** [REQUIRED]
Checks whether a book page on StoryGraph appears to be included with Kindle Unlimited.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 4 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 5 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
1. A StoryGraph book page with the Check Kindle Unlimited control and a status of “Available on Kindle Unlimited,” plus the View on Amazon link.
2. The same control showing “Kindle Unlimited was not detected.”
3. The same control showing “No matching Kindle result found” or a timeout message.

Do not imply affiliation with StoryGraph or Amazon. Do not crop in either company’s logo as if it were this extension’s branding.

## Permissions Justification

Copy these into the Chrome Web Store dashboard fields for each permission.

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Saves the outcome of a Kindle Unlimited check on the user’s device: the book title, author, optional ISBN, the result (available, not detected, no match), the Amazon page that was used, and when the check ran. Results are kept for 24 hours so a repeat check on the same book can show the last answer without opening Amazon again. In-progress checks are also stored briefly so the StoryGraph page can show the outcome when Amazon finishes. Timed-out checks are not saved. This data stays on the device and is not synced across browsers. |
| alarms | permissions | A check opens Amazon and waits for a result. If Amazon does not finish in time, an alarm ends the wait after about 45 seconds and the StoryGraph page shows that the check timed out instead of remaining on “Checking” indefinitely. |
| https://app.thestorygraph.com/* | host_permissions | The extension only runs on StoryGraph. This access is used to read the title, author, and ISBN of the book page the user is viewing, and to show the Check Kindle Unlimited control and status on that page. It is not used on other websites. |
| https://www.amazon.com/* | host_permissions | After the user clicks Check Kindle Unlimited, the extension opens Amazon Kindle search for that book (ISBN when available, otherwise title and author) and reads the matching product page to see whether Kindle Unlimited is offered. Product and search URLs on Amazon vary, so access is limited to amazon.com rather than a single path. It is not used on other shopping sites. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

The extension reads book details from the page the user is viewing and stores check results on the device. It does not send data to the developer. Running a check opens Amazon, so Amazon receives a normal page request that includes the search terms for that book.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | — |
| Health info | No | No | — | — |
| Financial info | No | No | — | — |
| Authentication info | No | No | — | — |
| Personal communications | No | No | — | — |
| Location | No | No | — | — |
| Web history | No | No | The extension does not record browsing history. It only uses the StoryGraph book page the user already has open and the Amazon page opened for that check. | — |
| User activity | Yes | No | Stores that the user checked a book and what the result was, on the device, for 24 hours so a repeat check can reuse it. | No |
| Website content | Yes | Yes — only to Amazon, and only when the user clicks Check Kindle Unlimited | Reads title, author, and ISBN from the StoryGraph book page. Opens Amazon with those search terms and reads Kindle Unlimited offer text from the matching product page. | No. The developer does not share data. Amazon receives the search as a normal visit the user initiated by clicking Check. |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
Not hosted yet. Publish the draft below at a stable public URL (GitHub Pages or a repo `docs/` page) before submission. The dashboard link must load without a login.

### Privacy policy draft (to host)

Privacy Policy for StoryGraph Kindle Unlimited Checker

Last updated: 2026-09-04

This extension is not affiliated with StoryGraph or Amazon.

What Data We Collect

When you open a StoryGraph book page, the extension reads the book title, author, and ISBN shown on that page so it can identify the book.

When you click Check Kindle Unlimited, the extension uses those details to look the book up on Amazon and reads whether Kindle Unlimited appears to be offered on the matching product page.

How Data Is Stored

Check results (book title, author, optional ISBN, result, Amazon page used, and time of the check) are stored on your device for 24 hours so a repeat check can reuse the last answer. In-progress checks are stored only until that check finishes or times out. This data is not synced to other browsers or sent to the developer.

How Data Is Used

Book details are used only to look up Kindle Unlimited availability and to show the result on the StoryGraph page you are viewing.

Third-Party Services

The extension does not use analytics, advertising, or accounts.

Checking a book opens Amazon in a new tab. Amazon then receives a normal page request that includes the search terms (ISBN, or title and author). Amazon’s handling of that visit is covered by Amazon’s own privacy policy.

Data Sharing

The developer does not sell or share your data. The only third-party site involved is Amazon, and only because you asked the extension to look the book up there.

Data Retention and Deletion

Saved results expire after 24 hours. You can remove all stored data by uninstalling the extension.

Changes to This Policy

If data practices change, this policy will be updated and the listing’s Last Updated date will change.

Contact

Privacy questions: kaleighscruggs@gmail.com
https://github.com/klgh/storygraph-ku-check/issues

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Kaleigh Scruggs

**Contact Email** [REQUIRED]
kaleighscruggs@gmail.com

**Support URL / Email** [RECOMMENDED]
https://github.com/klgh/storygraph-ku-check/issues

**Homepage URL** [RECOMMENDED]
https://github.com/klgh/storygraph-ku-check

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.8.0 | 2026-09-04 | After a strong Amazon search match, the product page is treated as the matched book and reported as available on Kindle Unlimited or not detected. | Draft |

## Review Notes

This section is for submission prep, not the public listing.

### Known Issues / Limitations
- The store name includes “StoryGraph” and “Kindle Unlimited.” The listing and privacy policy must state there is no affiliation. Reviewers sometimes reject trademarked names; if that happens, rename to a descriptive form such as “Kindle Unlimited check for StoryGraph.”
- No store icon or screenshots exist yet. Submission will fail without a 128×128 icon and at least one 1280×800 or 640×400 screenshot.
- Privacy policy URL is not live yet.
- A check opens Amazon in a foreground tab and can take up to about 45 seconds.
- A wrong edition can be selected if Amazon’s first strong search result is not the same book.
- Amazon access is site-wide on amazon.com because search and product URLs vary. The Amazon script only completes a lookup when the user started a check from StoryGraph.

### Rejection History
None yet.
