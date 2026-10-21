# The Give website prototype

Open `index.html` directly in a browser or serve this folder with any static web server.

This is a design prototype inspired by the broad structure of Morningside's one-page
band site, but it uses an original visual system, layout, copy treatment, and motion.

The four album covers in `assets/albums/` were retrieved from the releases' canonical
Apple/iTunes catalog records at 1200 × 1200. They are stored locally so the site does
not hotlink Apple image infrastructure. Confirm that the band or Memory Man Records
controls the web-display rights before public launch.

## Replace before launch

- Replace the CSS-generated press-photo placeholder with a current band photograph.
- Connect the mailing-list provider's tested hosted signup URL in `site-config.js` (see `MAILING-LIST-SETUP.md`).
- Replace the provisional 2027 show row when a date and venue are confirmed.
- Confirm final band-member credits and public-facing copy.

See `PUNCH-LIST.md` for the complete band-review checklist and a Slack-ready version.

## Public catalog and agent-readable content

The deployed site is still plain static HTML with no build step required at request time.
Its four album lists and 63 recording links are present in `index.html`, including when
JavaScript is unavailable. The existing native album disclosures, lyric-sheet treatments,
visual design, and newsletter integration remain in place.

- `tracks.js` is the existing source of truth for recording titles and platform links.
- `data/catalog-source.json` contains the public artist identity and album-level links
  already published on the website. Album titles must match `tracks.js` in the same order.
- `scripts/build-catalog.mjs` generates both the static recording HTML and Schema.org
  data in `index.html` and `catalog.jsonld`. Commit both generated outputs when changing
  either source file. Do not edit the generated regions or catalog by hand.
- `catalog.jsonld` describes the artist, four albums, and each album-specific recording.
  Distinct studio, acoustic, and live versions do not get merged just because their titles
  match. Unverified dates, durations, ISRCs, member credits, and show events are omitted.
- `robots.txt` advertises `sitemap.xml`, which lists the one canonical HTML page without
  anchor fragments or invented modification dates. This is crawler guidance, not access
  control or a content-use license.
- `llms.txt` is an optional factual navigation aid. It is not an established indexing
  requirement, and these changes do not promise search ranking or AI recommendation.

Using Node.js 20 or later, with no additional dependencies:

```sh
npm run build
npm run check
npm test
```

Before publishing, review the diff against the latest remote branch, run the commands
above, and visually compare desktop and mobile layouts with JavaScript on and off.
The catalog covers the releases currently linked on the website, not a claim of a
complete lifetime discography. It intentionally adds no cross-project identity links.
