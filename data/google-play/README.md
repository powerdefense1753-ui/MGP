# Google Play listing snapshots

This is an explicit, small seed import of 11 US-English Android strategy listings, not a crawl of the entire store or a popularity/quality ranking.

- `scripts/fetch-google-play.py`: fetches public product pages with three concurrent requests maximum, parses SoftwareApplication JSON-LD, and records URL, region, locale and UTC capture time. It does not sign in or work around access restrictions. A missing page or structured record is an error.
- `scripts/curate-google-play.py`: combines fetched facts with reviewed category mappings, checks each mapping's evidence against the captured text, and generates `src/data/google-play.json`.
- `npm run data:refresh`: runs fetching and then curation only if all selected pages succeeded. This command performs real network reads; builds use the checked-in catalog and do not scrape automatically.
- Prices are the captured USD offer, including promotions where applicable. Paid download does not imply absence of in-app purchases. A zero initial price does not imply all content is free.
- Missing ads/IAP labels remain null, unless the developer explicitly states the absence of that feature. Missing offline support is unconfirmed, not “online only.” Session duration and difficulty are deliberately null.
- Gameplay/culture/theme tags include human mappings from a developer description. They are not Google-assigned categories unless marked as a listing label. All tag excerpts are visible in the UI.
- The basic listing fetch excludes review text. A separate bounded detail fetch captures store aggregate ratings and three displayed reviews per game. Only short excerpts ship to the UI; summaries preserve sample IDs and dates. No player contact lists, install files, or login credentials are used. Google Play is the source, not a partner or endorsement.
- Initial discovery encountered 404s for `com.unciv` and `com.easytech.ew7`. Unciv was corrected to `com.unciv.app`; the other was omitted. The final seed list succeeds in full.
- The image CDN is now accessible. The table uses 11 official icons and 22 screenshots fetched directly from their listing URLs, stored in public/play-media. Original editorial illustrations are no longer used by the UI.

Adding a game requires a valid package ID, a successful source fetch, and reviewed mapping evidence. Refresh failure leaves the prior published catalog in place; raw snapshots may have been partially refreshed, so do not run curation after a failed fetch without investigating.
