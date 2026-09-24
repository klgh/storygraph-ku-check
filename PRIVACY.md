# Privacy Policy for StoryGraph Kindle Unlimited Checker

Last updated: September 24, 2026

StoryGraph Kindle Unlimited Checker checks whether a book you are viewing on StoryGraph appears to be included with
Kindle Unlimited. This extension is not affiliated with, endorsed by, or sponsored by StoryGraph or Amazon.

This policy explains what information the extension handles, why it is needed, where it is stored, and how you can
remove it.

## Data handled by the extension

When you open a StoryGraph book page, the extension reads the book title, author, and ISBN shown on that page so it can
identify the book.

When you click Check Kindle Unlimited, the extension uses those details to look the book up on Amazon and reads whether
Kindle Unlimited appears to be offered on the matching product page.

## How the data is used

Book details are used only to look up Kindle Unlimited availability and to show the result on the StoryGraph page you
are viewing. Clicking Check again looks the book up on Amazon again.

## Storage and deletion

The last finished check for a book (title, author, optional ISBN, result, Amazon page used, and time of the check) is
stored on your device for 24 hours so opening that book again can show the last answer. Timeouts are not kept in that
24-hour memory.

The result of each check, including a timeout, is stored on your device until you uninstall the extension, so the
StoryGraph page can show the outcome if you leave the page while Amazon is still loading.

A check in progress is stored only until that check finishes or times out.

This data is not synced to other browsers or sent to the developer. Uninstalling the extension removes all stored data.

## Transmission, sharing, and sale

The extension does not use analytics, advertising, or accounts. It has no developer-operated backend. The developer does
not sell or share your data.

Checking a book opens Amazon in a background tab and closes that tab when the check finishes. Amazon then receives a
normal page request that includes the search terms (ISBN, or title and author). Amazon’s handling of that visit is
covered by [Amazon’s privacy policy](https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ).

## Browser permissions

The extension requests only the access needed for this check:

- **StoryGraph** — read the title, author, and ISBN of the book you are viewing, and show the check control and status
  on that page.
- **Amazon** — after you click Check Kindle Unlimited, open an Amazon Kindle search and read whether Kindle Unlimited is
  offered on the matching product page.
- **On-device storage** — keep recent check results on your device, as described above.
- **A timer** — end a check if Amazon does not finish, so the page does not stay on “Checking” indefinitely.

## Security and support reports

Support requests contain only what users choose to submit. Report security vulnerabilities privately as described in
[SECURITY.md](./SECURITY.md).

## Changes to this policy

If data practices change, this policy will be updated and the date at the top of this document will be revised. Updates
are committed to the public source repository.

## Contact

Privacy and security questions may be sent to [kaleighscruggs@gmail.com](mailto:kaleighscruggs@gmail.com).

Project repository: <https://github.com/klgh/storygraph-ku-check>
