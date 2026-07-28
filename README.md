# StoryGraph KU Checker v0.6

Chrome extension MVP that checks whether a StoryGraph book appears to be included with Kindle Unlimited.

## v0.6

- Replaces strict title/author substring matching with weighted title-token and author-name matching.
- Accepts Amazon subtitles, series labels, edition text, and author role labels.
- Uses surname matching when Amazon formats the author byline differently.
- Uses a new cache namespace so older uncertain results are ignored.

Load the `dist` directory as an unpacked Chrome extension.
