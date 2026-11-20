---
name: check-links
description: Check every link on the site for breakage (monthly check, or after wheel colors, the catalogue or pages change). Covers site pages, wheel colors, hex codes, dupe shades, filter values and outside shop links.
---
1. Run `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" && npm run links:check`. It reads the links from the pages themselves (`check-links.js`), so there is no list of links to keep up to date. It checks dupe shades against the catalogue file in `data-build/`, not the Supabase table; if the live catalogue file is missing there, it says which file it used instead.
2. Report the results to the user, grouped as the script prints them, with the page each link is on:
   - **Broken** (exit code 1): missing pages or files, wheel colors no longer on the wheel, bad hex codes, dupe shades or filter values not in the catalogue, outside links that fail or now go to a shop's home page.
   - **Refused the check**: sites that sent 401/403/429/999. Ask the user to open them. Add a site to `link-check-manual.json` only after the user confirms its page loads.
   - **Check by hand**: links on sites in `link-check-manual.json`. List them so the user can click through.
3. For each broken link, say why it broke before proposing a fix (e.g. a wheel color was renamed: add it to `RENAMED` in `parseSharedLink` in `app.jsx` rather than editing every page). Don't change links until the user picks a fix. Generated pages are fixed at their source (`build-pages.js`, `build-dupe-pages.js`, `dupe-picks.json`) and rebuilt, not edited by hand. The red and pink guides are snapshots: fix their links, but leave their figures alone.
