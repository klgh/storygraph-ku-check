# StoryGraph KU Checker v0.7

Chrome extension MVP that checks whether a StoryGraph book appears to be included with Kindle Unlimited.

## v0.7

- Replaces strict title/author substring matching with weighted title-token and author-name matching.
- Accepts Amazon subtitles, series labels, edition text, and author role labels.
- Uses surname matching when Amazon formats the author byline differently.
- Uses a new cache namespace so older uncertain results are ignored.

Load the `dist` directory as an unpacked Chrome extension.


## v0.9 matching change

After the extension selects a sufficiently strong Amazon search result, the product page is treated as the matched book. Amazon subtitle/byline formatting no longer downgrades every result to “Possible match.” The product page now resolves to **Available on Kindle Unlimited** or **Kindle Unlimited was not detected**.
