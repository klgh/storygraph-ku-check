# Chrome Web Store Listing — StoryGraph Kindle Unlimited Checker

> Last Updated: 2026-09-24

## Store Listing

**Extension Name** [REQUIRED]
StoryGraph Kindle Unlimited Checker

**Short Description** [REQUIRED]
Checks whether a StoryGraph book appears to be available through Kindle Unlimited.

**Detailed Description** [REQUIRED]
See if a book you are viewing on StoryGraph appears to be included with Kindle Unlimited, then open the matching Amazon page to confirm.

FEATURES
• Adds a Check Kindle Unlimited control on StoryGraph book pages
• Shows Available on Kindle Unlimited, Kindle Unlimited was not detected, Possible match, No matching Kindle edition found, or a timeout
• Shows the last result when you return to the same book within 24 hours
• Check again looks the book up on Amazon again
• Opens Amazon in a background tab and closes that tab when the check finishes
• Links to the Amazon page that was used for the result

HOW TO USE

1. Open a book page on StoryGraph (app.thestorygraph.com)
2. Click Check Kindle Unlimited
3. Review the status that appears on the StoryGraph page
4. Optionally open View on Amazon to confirm the listing yourself

PRIVACY
This extension does not have an account and does not send data to the developer. When you run a check, it reads the book title, author, and ISBN from the StoryGraph page you are viewing, opens Amazon in a background tab to look that book up, and closes that tab when the check finishes. The last finished result for a book stays on your device for 24 hours. Uninstalling the extension removes stored data.

This project is not affiliated with, endorsed by, or sponsored by StoryGraph or Amazon.

PERMISSIONS
• Storage — saves recent check results on your device so a return visit can reuse them
• Alarms — ends a check if Amazon does not respond so the page does not wait forever
• StoryGraph — needed to show the check control and read the book you are looking at
• Amazon — needed to look up that book and see whether Kindle Unlimited is offered

SUPPORT
Questions or problems: https://github.com/klgh/storygraph-ku-check/issues

Version 0.0.0.1 — Initial release. Returning to a book within 24 hours shows the last result. Check again looks the book up on Amazon again.

**Category** [REQUIRED]
Shopping

**Single Purpose** [REQUIRED]
Checks whether a book page on StoryGraph appears to be included with Kindle Unlimited.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
| ------- | ----------- | -------- | ---------- |
| Store Icon [REQUIRED] | 128×128 PNG | ⬜ Not created | |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 4 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 5 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

The extension package has no toolbar icon. Chrome will use its default icon until you add icon files. The store listing still requires a separate 128×128 PNG uploaded in the dashboard.

### Screenshot Notes

1. A StoryGraph book page with the Check Kindle Unlimited control, the status “Available on Kindle Unlimited,” and the View on Amazon link.
2. The same control showing “Kindle Unlimited was not detected.”
3. The same control showing “No matching Kindle edition found” or “Amazon check timed out.”

Do not imply affiliation with StoryGraph or Amazon. Do not crop in either company’s logo as if it were this extension’s branding.

## Permissions Justification

Copy these into the Chrome Web Store dashboard fields for each permission.

| Permission | Type | Justification |
| ------------ | ------ | --------------- |
| storage | permissions | Saves Kindle Unlimited check results on the user’s device. A finished result (book title, author, optional ISBN, result, Amazon page used, and time of the check) is kept for 24 hours so returning to the same book can show the last answer without opening Amazon again. Timeouts are not kept in that 24-hour memory. Each check’s result, including a timeout, is also kept until the extension is uninstalled so the StoryGraph page can show the outcome if the user leaves the page while Amazon is still loading. A check in progress is kept only until that check finishes or times out. Nothing is synced across browsers or sent to the developer. Clicking Check again always looks the book up on Amazon again. |
| alarms | permissions | A check opens Amazon and waits for a result. If Amazon does not finish in time, an alarm ends the wait after about 45 seconds and the StoryGraph page shows that the check timed out instead of remaining on “Checking” indefinitely. |
| https://app.thestorygraph.com/* | host_permissions | This permission is only for StoryGraph book pages. It is used to read the title, author, and ISBN of the book the user is viewing, and to show the Check Kindle Unlimited control and status on that page. It is not used on other websites. |
| https://www.amazon.com/* | host_permissions | After the user clicks Check Kindle Unlimited, the extension opens an Amazon Kindle search in a background tab (ISBN when available, otherwise title and author) and reads the matching product page to see whether Kindle Unlimited is offered. That tab is closed when the check finishes. Product and search URLs on Amazon vary, so access is limited to amazon.com rather than a single path. It is not used on other shopping sites. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

The extension reads book details from the page the user is viewing and stores check results on the device. It does not send data to the developer. Running a check opens Amazon, so Amazon receives a normal page request that includes the search terms for that book.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
| ----------- | ----------- | ------------------------ | --------- | --------------------------- |
| Personally identifiable info | No | No | — | — |
| Health info | No | No | — | — |
| Financial info | No | No | — | — |
| Authentication info | No | No | — | — |
| Personal communications | No | No | — | — |
| Location | No | No | — | — |
| Web history | No | No | The extension does not record browsing history. It only uses the StoryGraph book page the user already has open and the Amazon page opened for that check. | — |
| User activity | Yes | No | Stores that the user checked a book and what the result was. The last finished result for a book stays on the device for 24 hours so a return visit can reuse it. Timeouts are excluded from that 24-hour memory. The result of each check, including a timeout, stays on the device until the extension is uninstalled. | No |
| Website content | Yes | Yes — only to Amazon, and only when the user clicks Check Kindle Unlimited | Reads title, author, and ISBN from the StoryGraph book page. Opens Amazon with those search terms and reads Kindle Unlimited offer text from the matching product page. | No. The developer does not share data. Amazon receives the search as a normal visit the user started by clicking Check. |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
Not hosted yet. Publish the draft below at a stable public URL (GitHub Pages or a public repo page) before submission. The dashboard link must load without a login.

### Privacy policy draft (to host)

Privacy Policy for StoryGraph Kindle Unlimited Checker

Last updated: 2026-09-24

This extension is not affiliated with StoryGraph or Amazon.

What Data We Collect

When you open a StoryGraph book page, the extension reads the book title, author, and ISBN shown on that page so it can identify the book.

When you click Check Kindle Unlimited, the extension uses those details to look the book up on Amazon and reads whether Kindle Unlimited appears to be offered on the matching product page.

How Data Is Stored

The last finished check for a book (title, author, optional ISBN, result, Amazon page used, and time of the check) is stored on your device for 24 hours so opening that book again can show the last answer. Timeouts are not kept in that 24-hour memory.

The result of each check, including a timeout, is stored on your device until you uninstall the extension, so the StoryGraph page can show the outcome if you leave the page while Amazon is still loading.

A check in progress is stored only until that check finishes or times out.

This data is not synced to other browsers or sent to the developer.

How Data Is Used

Book details are used only to look up Kindle Unlimited availability and to show the result on the StoryGraph page you are viewing. Clicking Check again looks the book up on Amazon again.

Third-Party Services

The extension does not use analytics, advertising, or accounts.

Checking a book opens Amazon in a background tab and closes that tab when the check finishes. Amazon then receives a normal page request that includes the search terms (ISBN, or title and author). Amazon’s handling of that visit is covered by Amazon’s own privacy policy: https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ

Data Sharing

The developer does not sell or share your data. The only third-party site involved is Amazon, and only because you asked the extension to look the book up there.

Data Retention and Deletion

The 24-hour memory expires on its own. Other saved results stay until you uninstall the extension. Uninstalling removes all stored data.

Changes to This Policy

If data practices change, this policy will be updated and the Last updated date will change.

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
| --------- | ------ | --------- | -------- |
| 0.0.0.1 | 2026-09-24 | Initial release. Returning to a book within 24 hours shows the last result. Check again always looks the book up on Amazon again, in a background tab that closes when the check finishes. | Draft |

## Review Notes

This section is for submission prep, not the public listing.

### Before the first submission

1. Finish creating the publisher named Kaleigh Scruggs.
2. Host the privacy policy draft at a public URL and paste that URL into the dashboard.
3. Upload a 128×128 store icon and at least one 1280×800 or 640×400 screenshot.
4. Run `npm run build`, then zip the files inside `dist/` (the manifest and the three script files). Do not zip the repository.
5. Create a new item, upload the zip, and paste the listing, permission justifications, and privacy answers from this file.
6. On the privacy form, answer that the extension collects user data. Declare user activity and website content. Leave the other data types off. Certify that data is not sold, not used for unrelated purposes, and not used for creditworthiness.

### Known Issues / Limitations

- The store name includes “StoryGraph” and “Kindle Unlimited.” The listing and privacy policy state there is no affiliation. Reviewers sometimes reject trademarked names; if that happens, rename to a descriptive form such as “Kindle Unlimited check for StoryGraph.”
- No store icon or screenshots exist yet. Submission will fail without a 128×128 icon and at least one 1280×800 or 640×400 screenshot.
- Privacy policy URL is not live yet.
- A check opens Amazon in a background tab. The tab closes when the check finishes. If the check times out, that tab can stay open.
- A check can take up to about 45 seconds.
- A wrong edition can be selected if Amazon’s first strong search result is not the same book.
- Amazon access is site-wide on amazon.com because search and product URLs vary. The Amazon script only completes a lookup when the user started a check from StoryGraph.
- The manifest `name` (35 characters) and `description` (82 characters) match this listing. Both are within the store limits of 75 and 132.

### Rejection History

None yet.
