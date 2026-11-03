# Importing Instagram and TikTok saved posts into Niches: technical and legal feasibility (2025–2026)

Research context: done on 2026-11-03. The session's network sandbox blocked direct fetches of developers.facebook.com, developers.tiktok.com, transparency.meta.com, tiktok.com, instagram.com and several blogs. So the findings below come from (a) web-search summaries of those official pages and (b) open-source parser code read straight from GitHub (raw.githubusercontent.com and GitHub code search). Where a claim rests only on a search-engine summary of an official page, it says so. Live endpoint tests (TikTok oEmbed, Instagram Open Graph) could not be run because the proxy returned 403.

## 1. Official data exports (Instagram "Download your information"; TikTok "Download your data")

### Takeaway
Both exports include the user's saves. Instagram gives `saved_posts.json` plus `saved_collections.json`, which carries collection names. TikTok gives "Favorite Videos" and "Like List" inside `user_data_tiktok.json`. In both cases the data is only links, timestamps and (on Instagram) the owner username. There is no media, no caption, and no thumbnail, so every item must be enriched afterwards (see section 3).

### Cited Findings
**Instagram**
- Path: Accounts Center → Your information and permissions → Download your information. JSON format can be chosen, and you can pick "Some of your information" and tick only "Saved" — [redact.dev guide](https://redact.dev/blog/instagram-data-file-download); [listsdiff guide](https://listsdiff.pages.dev/guides/instagram-data-download-time-and-files); [Marqly 2026 guide (search summary)](https://www.marqly.com/blog/export-instagram-saved-posts)
- File locations in the archive: `your_instagram_activity/saved/saved_posts.json` and `your_instagram_activity/saved/saved_collections.json` — [onfabric/context-use parser, pipe.py](https://github.com/onfabric/context-use/blob/main/context_use/providers/instagram/saved/pipe.py); a forensics tool matches `*/saved/saved_posts.json` (last updated 2025-07-02) — [abrignoni/RLEAPP instagramSavedposts.py](https://github.com/abrignoni/RLEAPP/blob/main/scripts/artifacts/instagramSavedposts.py)
- `saved_posts.json` structure: top-level key `saved_saved_media`, an array of `{ "title": <owner username>, "string_map_data": { "Saved on": { "href": <post URL>, "timestamp": <unix seconds> } } }`. This sample is from an open-source importer — [bramses/ycb-companion instagram-saved.tsx](https://github.com/bramses/ycb-companion/blob/main/src/components/importers/instagram-saved.tsx):
  ```json
  {"saved_saved_media": [
    {"title": "houseofgaming",
     "string_map_data": {"Saved on": {"href": "https://www.instagram.com/reel/DFORoI7Azzs/", "timestamp": 1739667172}}}
  ]}
  ```
  RLEAPP reads the same fields: `title` as "Profile Name", plus `href` and `timestamp` — [RLEAPP](https://github.com/abrignoni/RLEAPP/blob/main/scripts/artifacts/instagramSavedposts.py)
- The inner key "Saved on" is **localized** to the export language, so a parser should take the first entry rather than hard-code "Saved on" — [0dot77/media-tech-collection CLAUDE.md ("verified against real exports")](https://github.com/0dot77/media-tech-collection/blob/main/CLAUDE.md)
- `saved_collections.json` structure: top-level key `saved_saved_collections`, a flat array where a **header** row starts each collection (`{title: "Collection", string_map_data: {Name: {value: <collection name>}, "Creation Time": {timestamp}}}`). The header is followed by **item** rows `{string_map_data: {Name: {value: <owner username>, href: <post URL>}, "Added Time": {timestamp}}}` — [onfabric/context-use pipe.py and schemas.py](https://github.com/onfabric/context-use/blob/main/context_use/providers/instagram/saved/schemas.py). Other tools parse the same key: [dotWee/py-ig2raindrop-cli](https://github.com/dotWee/py-ig2raindrop-cli) (an Instagram → Raindrop.io importer) and [open-data-labs/userdata-extractor](https://github.com/open-data-labs/userdata-extractor), which queries `$.saved_saved_collections[*].string_map_data`
- The export holds links and timestamps only. It has no media and no captions — [Marqly guide (search summary)](https://www.marqly.com/blog/export-instagram-saved-posts). An HTML export variant (`saved_posts.html`) also exists — same source
- Collections are labels on top of "All posts". Removing a post from a collection keeps it in All posts — [ContextBolt](https://contextbolt.com/blog/instagram-saved-posts/)
- Turnaround estimates are third-party only and they conflict: "a few hours to a few days," "up to 14 days," and "minutes for small accounts to up to 48h" — [redact.dev](https://redact.dev/blog/instagram-data-file-download); [listsdiff](https://listsdiff.pages.dev/guides/instagram-data-download-time-and-files); [privacy-tools-guide 2026](https://privacy-tools-guide.pages.dev/instagram-data-download-and-delete-guide-2026/)
- A 2026 analysis says Meta merged DYI and Transfer Your Information into one tool called "Export Your Information" — [SCiDA, Apr 2026](https://scidaproject.com/2026/04/02/dma-compliance-reports-in-year-three-reading-between-the-many-lines/)

**TikTok**
- Path: Profile → Settings and privacy → Account → Download your data. Choose JSON, which carries the exact save date — [ScrollBack guide](https://scroll-back.com/guides/how-to-download-your-tiktok-data); [Stashr guide (search summary)](https://stashr.me/blog/export-tiktok-data)
- File: `user_data_tiktok.json` (older exports: `user_data.json`) — [abrignoni/RLEAPP tikTokArchiveJson.py, as quoted in LiorJossef/no-crumbs corroboration file (2026-08-27)](https://github.com/LiorJossef/no-crumbs/blob/main/docs/evidence/capture/raw/07-export-json-schema-corroboration.txt); [joeycato/tiktok-favesave README](https://github.com/joeycato/tiktok-favesave)
- Structure (from the same corroboration file, which cites 7 independent parsers):
  - Top-level activity node: `"Your Activity"` in newer exports, `"Activity"` in older ones, with `"Likes and Favorites"` seen as a fallback node
  - Favorites (bookmarks): `["Your Activity"]["Favorite Videos"]["FavoriteVideoList"]` → `[{ "Date": "YYYY-MM-DD HH:MM:SS", "Link": "https://www.tiktokv.com/share/video/<id>/" }]`
  - Likes: `["Like List"]["ItemFavoriteList"]` → `[{ "date"/"Date", "link"/"Link" }]`. Key casing varies between export versions
  - Also present: `"Favorite Sounds"`→`FavoriteSoundList`, Favorite Hashtags/Effects, `"Video Browsing History"`→`VideoList`, and `"Share History"`
  — [no-crumbs corroboration file](https://github.com/LiorJossef/no-crumbs/blob/main/docs/evidence/capture/raw/07-export-json-schema-corroboration.txt); [zollo/tiktok-downloader data_structure.yml (search summary)](https://github.com/zollo/tiktok-downloader/blob/main/data_structure.yml); [davidkeipert/tikfav](https://github.com/davidkeipert/tikfav)
- Links use the `tiktokv.com/share/video/<id>` form, which yt-dlp accepts as a valid TikTok video URL. So the video ID can be pulled out and turned back into a `tiktok.com/@/video/<id>` URL — [yt-dlp extractor regex, quoted in corroboration file](https://github.com/LiorJossef/no-crumbs/blob/main/docs/evidence/capture/raw/07-export-json-schema-corroboration.txt)
- Favorites come back as a bare list of save date plus video link — [Stashr (search summary)](https://stashr.me/blog/export-tiktok-data)
- The Activity export also includes VideoBrowsingHistory, Likes, FavoriteEffects, FavoriteSounds and SavedHashtags — [takeoutday.org](https://takeoutday.org/guides/how-to-export-tiktok-data)

### Inferences
- An Instagram import can rebuild a user's named collections (for example, an IG "Recipes" collection mapped to a Niches board) with owner username, URL and saved/added time. The parser has to handle the flat header/item layout and localized keys.
- A TikTok import gives a flat list of favorites with no collection names (see Gaps), so the user or an auto-classifier has to sort items into boards.
- Exports are a one-time, asynchronous snapshot that takes hours to days, so they suit an "import my history" onboarding step, not ongoing sync. Parsing can run on the device (one project parses export ZIPs client-side in a Web Worker — [0dot77 CLAUDE.md](https://github.com/0dot77/media-tech-collection/blob/main/CLAUDE.md)). The upload UX still involves several steps on a phone: request, wait for email, download the ZIP, then share or upload it to Niches.

### Gaps
- No official Meta or TikTok schema documentation was found. All structures come from community parsers that read real exports (strong agreement across tools, but key names change over time).
- **TikTok "Favorites collections"** (the user-named folders inside Favorites): I found no evidence that the export includes collection names or membership. Assume it does not until tested with a real export.
- No official Meta or TikTok figure for turnaround time was found.

## 2. Official APIs for reading a user's saved posts

### Takeaway
**No.** As of late 2026, neither Meta nor TikTok offers a general developer API that returns a user's saved, bookmarked or favorited posts. The only official programmatic path is TikTok's **Data Portability API**, which is limited to EEA/UK users and requires approval. Its "activity" scope likely includes favorites. Meta has no equivalent third-party API, as far as found.

### Cited Findings
- **Instagram Basic Display API ended on December 4, 2024** (DEPRECATED). Meta offers no consumer-app API for personal-account content — [DEV Community, "Instagram Data API in 2026"](https://dev.to/slugbye/instagram-data-api-in-2026-what-metas-api-can-and-cant-do-3b0a)
- The remaining Instagram Platform APIs (Graph API / "Instagram API with Instagram Login") cover professional accounts' own media, insights, publishing and so on. The official docs found in search cover media and insights, with no saved endpoint — [Meta Instagram Platform reference (search result)](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights); [DEV Community](https://dev.to/slugbye/instagram-data-api-in-2026-what-metas-api-can-and-cant-do-3b0a)
- **TikTok Display API / Login Kit** scopes include `user.info.basic`, `user.info.stats` and `video.list` (the user's *own public* videos). No liked or favorites scope was found — [TikTok scopes reference (search summary)](https://developers.tiktok.com/doc/tiktok-api-scopes); [TikTok Display API get started](https://developers.tiktok.com/doc/display-api-get-started/)
- **TikTok Data Portability API** (launched 2024 for DMA): scopes take the form `portability.<type>.single|ongoing`, with types `all`, `activity`, `directmessages` and `postsandprofile`. Request categories are `all_data, video, profile, activity, direct_message` — [TikTok Data Portability API get started (search summary)](https://developers.tiktok.com/doc/data-portability-api-get-started); [Add Data Request (search summary)](https://developers.tiktok.com/doc/data-portability-api-add-data-request)
- TikTok Data Portability API eligibility: "available to qualified applicants globally, but currently only covers data for TikTok users in the EEA and UK." Applicants need a well-defined use case, and approval typically takes 3–4 weeks — [TikTok Data Portability API overview (search summary)](https://developers.tiktok.com/products/data-portability-api/); [TikTok blog 2024 (search summary)](https://developers.TikTok.com/blog/2024-introducing-tiktok-data-portability-api); [Social Media Today](https://www.socialmediatoday.com/news/tiktok-data-portability-api-meet-new-eu-requirements/709266/)
- TikTok describes the API as letting registered developers ask user permission to transfer a copy of their TikTok data — [TikTok newsroom, DMA compliance](https://newsroom.tiktok.com/en-eu/tiktoks-compliance-with-the-dma)
- **Meta**: its DMA Art. 6(9) compliance rests on Download Your Information and Transfer Your Information (TYI ports photos, videos and posts to chosen destination services). It does not rest on an open developer API — [Meta DMA compliance summary (2024 copy)](https://www.dpo-india.com/Resources/Digital_Markets_Act(DMA)_EU/Meta-Compliance-with-Digital-Markets-Act.pdf); [Meta compliance report 2025 (search summary)](https://transparency.meta.com/sr/meta-compliance-report-2025)
- A study of 7 developers found that Meta, unlike most gatekeepers, had not implemented an API or other automatic transfer, and had removed its portability documentation. Alphabet, ByteDance, Microsoft and Amazon do have portability APIs — [Tech Policy Press](https://www.techpolicy.press/can-data-portability-shift-power-in-europes-digital-ecosystem/); [MyData Global report, Nov 2024](https://mydata.org/wp-content/uploads/2024/11/Interoperability-and-the-DMA-in-Action-Developers-Experiences-of-Data-Portability-API-Access.pdf)
- In 2026 Meta merged DYI and TYI into "Export Your Information" — [SCiDA, Apr 2026](https://scidaproject.com/2026/04/02/dma-compliance-reports-in-year-three-reading-between-the-many-lines/)

### Inferences
- Because the DYI export includes `saved_posts.json`, the "activity" bucket of TikTok's portability API very likely contains the same Favorite Videos and Like List as the consumer export. This is not confirmed (see Gaps).
- For a global, US-heavy consumer app, the TikTok portability API helps only EEA/UK users, needs an approval process, and is meant for one-off or ongoing data transfer. It is a "later" option, not a demo path.
- Any vendor claiming "Instagram saved posts API" access is almost certainly scraping or automating a logged-in session (see section 5).

### Gaps
- TikTok's "Data Types" page, which lists what the `activity` scope contains, could not be read (domain blocked, and not surfaced in search). Whether it explicitly includes "Favorite Videos" is unconfirmed.
- The full text of Meta's 2025/2026 DMA compliance report could not be fetched. Whether Meta launched any developer-facing portability API in 2025–2026 is unconfirmed, and none was found.

## 3. Displaying imported items: oEmbed, thumbnails, Open Graph

### Takeaway
Embeds are the sanctioned display route. **TikTok oEmbed** (`https://www.tiktok.com/oembed?url=…`) is public and returns `thumbnail_url`. **Instagram oEmbed** stopped returning `thumbnail_url` and `author_name` on Nov 3, 2025, and since mid-2026 **no longer needs an access token** (capped at 1,000 tokenless requests/hour per endpoint). Platform thumbnail URLs are signed and expire within days, so hot-linking breaks. Whether caching is permitted is not clearly stated by either platform.

### Cited Findings
- Meta removed `author_name, author_url, thumbnail_height, thumbnail_url, thumbnail_width` from oEmbed, fully deprecated **November 3, 2025**. `/instagram_oembed` no longer returns `thumbnail_url`, `thumbnail_width`, `thumbnail_height` or `author_name` — [Meta oEmbed updates blog, 2025-04-08 (search summary)](https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/); [Iframely: FB & IG oEmbed thumbnail deprecation](https://iframely.com/updates/193071-facebook-and-instagram-oembed-thumbnail-deprecation)
- Migration to the "Meta oEmbed Read" feature: apps created after April 8, 2025 used it from the start, and the deadline was extended to Nov 3, 2025 — [Meta oEmbed Read feature reference (search summary)](https://developers.facebook.com/docs/features-reference/oembed-read); [Bluehost explainer](https://www.bluehost.com/blog/meta-oembed-read-explained/)
- Meta recommends developers generate their own thumbnails from the post's HTML metadata. Iframely notes Instagram's meta images are cropped — [Iframely](https://iframely.com/updates/193071-facebook-and-instagram-oembed-thumbnail-deprecation) (citing Meta)
- **2026 change:** "On June 15, 2026, we lifted the access token requirement from all Meta oEmbed APIs," including Instagram. Tokenless calls are capped at 1,000 requests per endpoint per hour. Apps approved for Meta oEmbed Read can still use a token for up to 5 million requests per endpoint per day — [Meta Graph API reference, oEmbed (search summary)](https://developers.facebook.com/docs/graph-api/reference/oembed-video); [b3s PR "Embed Facebook and Instagram posts without an access token" (v26.0)](https://github.com/b3s/b3s/pull/459); [WP Mayor](https://wpmayor.com/meta-tokenless-oembed-wordpress/); [Spotlight WP](https://spotlightwp.com/instagram-embed-wordpress/). Releasebot dates it to May 15, 2026 — [Releasebot](https://releasebot.io/updates/meta/instagram-platform) (conflict, though Meta's own reference says June 15)
- Tokenless rate limits "may differ" from token-based ones — [WP Mayor (search summary)](https://wpmayor.com/meta-tokenless-oembed-wordpress/)
- Removing the fields broke tools that relied on them, such as Discourse Instagram oneboxes — [Discourse Meta](https://meta.discourse.org/t/configure-an-app-token-for-instagram-oneboxes/223548)
- **TikTok oEmbed** turns a video link into embed markup and metadata, and the sample response includes `thumbnail_url`. The docs don't say how long the URL lasts or whether it may be stored — [TikTok Embed Videos docs (search summary)](https://developers.tiktok.com/doc/embed-videos)
- TikTok and Instagram thumbnail/CDN URLs carry expiry signatures and usually stop working within a few days. Iframely advises copying images to your own storage/CDN when received, and calls hot-linking unreliable — [Iframely help: expiring images](https://iframely.com/help/015914-how-to-deal-with-expiring-images-of-tik-tok-and-instagram)
- Open Graph: Instagram has served its login page (no og:image) to link-preview crawlers before, for example the 2021 iMessage preview bug — [MacRumors 2021](https://www.macrumors.com/2021/02/18/instagram-to-fix-imessage-link-preview-bug/). One project notes "Instagram has no free server path → link card + client-side embed" — [0dot77 CLAUDE.md](https://github.com/0dot77/media-tech-collection/blob/main/CLAUDE.md) (written before the 2026 tokenless change)
- Raindrop pulls title, description and thumbnail automatically, and previews only work for publicly accessible pages — [Raindrop help](https://help.raindrop.io/llms-full.txt)

### Inferences
- Suggested display model: render each imported item as an **embed** (TikTok `blockquote` + embed.js, or the `tiktok.com/embed/v2/<id>` iframe; Instagram `blockquote` + embed.js or the post's `/embed` iframe) inside a WebView when the item is opened. In the board grid, show a card with the platform icon, the owner handle (Instagram export `title`), and a thumbnail where one exists.
- Thumbnails for TikTok: oEmbed `thumbnail_url` (it expires, so either refresh on demand or cache short-term). Thumbnails for Instagram: since Nov 2025 there is no oEmbed thumbnail, so the options are og:image scraping (fragile, ToS gray area), a screenshot of the rendered embed, or a branded placeholder with the user's own note. An early demo should accept placeholders and TikTok thumbnails.
- Caching or re-hosting thumbnails long term is technically needed for a smooth grid. It is legally the riskiest display choice, because the image is the creator's copyrighted work (see section 5). A safer pattern is to cache only short-term (hours to days) and refresh via oEmbed. Or store thumbnails privately, per user, as personal bookmarks and not on public or social surfaces.
- Because Niches is a *social* app where boards can be shared, an imported item shown to *other* users should be an official embed (the platform-sanctioned way to redistribute), not a re-hosted copy.

### Gaps
- The exact clauses in Meta's oEmbed / Platform Terms and TikTok's embed terms on caching oEmbed responses or thumbnails could not be read (domains blocked). In particular I don't know whether Meta's terms still require displaying the embed unmodified, or forbid storing oEmbed HTML or thumbnails beyond a time limit.
- Whether the tokenless Instagram oEmbed returns any thumbnail field again is unconfirmed (presumably not).
- TikTok og:image behavior for server-side fetchers was not verified.

## 4. Share-sheet approach ("Share to Niches") in Expo/React Native

### Takeaway
This is very feasible and is the method the recipe-app precedents use. Instagram and TikTok both expose a system share or "Share to…" option that passes a **URL** (plus sometimes text) to a share extension or intent. In Expo, `expo-share-intent` (config plugin; needs a dev build, not Expo Go) handles both iOS and Android. Newer Expo SDKs also document share-extension support in `expo-sharing`.

### Cited Findings
- `expo-share-intent` is an Expo native module and config plugin. Version mapping: SDK 54 → 5.x, SDK 58 → 9.x. Its content-type config defines both the iOS activation rules and the Android intent filters, and it is not compatible with Expo Go (needs a custom dev build) — [achorein/expo-share-intent](https://github.com/achorein/expo-share-intent); [npm](https://www.npmjs.com/package/expo-share-intent); [demo repo](https://github.com/achorein/expo-share-intent-demo)
- An alternative, `expo-share-extension`, is a config plugin for an iOS share extension with a **custom React Native view** (lets you show a "pick a board" UI inside the extension). It passes a shared URL in a `url` field of the initial props — [MaxAst/expo-share-extension](https://github.com/MaxAst/expo-share-extension); another option is [timedtext/expo-config-plugin-ios-share-extension](https://github.com/timedtext/expo-config-plugin-ios-share-extension)
- Newer Expo docs (SDK 57/58) describe an iOS Share Extension via `expo-sharing`, with a caveat that the approach "is not officially supported by Apple and may stop working in a future iOS release" — [Expo sharing docs v58](https://docs.expo.dev/versions/v58.0.0/sdk/sharing.md); [v57](https://docs.expo.dev/versions/v57.0.0/sdk/sharing.md)
- Instagram shared links carry a tracking parameter (`?igsh=…`, possibly renamed `igsi`). The base URL (for example `https://www.instagram.com/reel/<code>/`) stays the same if you strip it — [Sleekly (low-quality source)](https://sleekly.pages.dev/blog/what-is-igsh-instagram-links); [fixupxer release notes](https://github.com/NeatCode-Labs/fixupxer/releases/tag/v2.6.3)
- Precedent: Honeydew's flow is "In TikTok tap Share → choose Honeydew" (one-tap if pinned in the share sheet), and AI extracts ingredients and steps — [Honeydew blog](https://honeydewcook.com/blog/recipe-importing-tiktok-grocery-list). For ReciMe, sharing a TikTok/Instagram video produces ingredients and steps, accuracy drops when the recipe is only in the video, and comments aren't read — [WhistleOut ReciMe review](https://www.whistleout.com/CellPhones/Apps/recime-app-review); [cookbookmanager comparison](https://cookbookmanager.com/post/best-apps-to-save-recipes-from-tiktok)

### Inferences
- What arrives: on both platforms, a public post URL. Instagram sends `instagram.com/p|reel/<shortcode>/?igsh=…`. TikTok typically sends a short link (`vm.tiktok.com/…` or `tiktok.com/t/…`) that must be resolved by redirect to `tiktok.com/@user/video/<id>`, sometimes inside extra share text. (This is from general platform behavior, not a primary source this session. Log real payloads on a dev build.) No media or caption arrives, so enrichment works as in section 3.
- Instagram's "Share to…" sheet for Reels/posts includes the OS share sheet, so third-party share extensions appear there. TikTok's share panel includes "More"/"Other" options that open the OS share sheet (consistent with the Honeydew/ReciMe flows above).
- On iOS, a minimal extension that only hands the URL to the main app (for example by opening the app via deep link, or writing to an App Group) is simpler than rendering an RN board-picker inside the extension. Extension memory limits make a heavy RN UI riskier.
- Share-sheet capture is user-initiated, one item at a time, and needs no platform API, app review or scraping. It is the cleanest legal posture and works globally.

### Gaps
- No primary source confirms the exact payload (URL vs. text vs. both) Instagram and TikTok send to third-party share extensions on current iOS/Android versions. This needs to be tested.

## 5. Legal / ToS constraints (scraping, storing content, embeds, copyright, GDPR/DMA)

### Takeaway
User-initiated paths (the user uploads their own GDPR/DMA export, or shares a link via the share sheet) plus official embeds are low-risk. Scraping Instagram or TikTok, automating a user's logged-in session, or bulk-downloading media breaks both platforms' terms without written permission. Re-hosting creators' thumbnails or media for public display carries copyright risk.

### Cited Findings
- Meta Terms prohibit collecting data from Meta products by automated means (scraping and similar), logged-in or not, without prior permission. Permitted collection must follow Meta's Automated Data Collection Terms — [ConductAtlas summary of Meta ToS](https://conductatlas.com/platform/meta/meta-terms-of-service/automated-data-collection-restrictions/) (third-party summary)
- In *Meta v. Bright Data* (N.D. Cal., Jan 2024) the court granted summary judgment to Bright Data. Logged-off scraping of public data did not breach Meta's terms, which govern "your use" of the products. An appeal was considered likely — [Farella Braun + Martel](https://www.fbm.com/business-litigation/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/); [JD Supra](https://www.jdsupra.com/legalnews/major-decision-affects-law-of-scraping-1470808/)
- TikTok Terms: users may not "scrape, crawl, export or otherwise extract any data or content … using any automated system … except as approved in writing by TikTok" (current US text references the TikTok USDS Joint Venture) — [ConductAtlas excerpt of TikTok ToS](https://conductatlas.com/platform/tiktok/tiktok-terms-of-service/prohibition-on-scraping-and-data-extraction/) (third-party, dates inconsistent)
- TikTok's developer docs present embeds and APIs as the way to display TikTok content and creator profiles in third-party apps or sites — [TikTok Content Display landing (search summary)](https://developers.tiktok.com/docs/en/content-display-landing)
- DMA Art. 6(9) requires gatekeepers to provide effective, continuous and real-time portability of data provided or generated by the user, including to authorized third parties. What "real-time" means remains contested, and some gatekeeper APIs allow only one-time transfers — [MyData Global](https://mydata.org/wp-content/uploads/2024/11/Interoperability-and-the-DMA-in-Action-Developers-Experiences-of-Data-Portability-API-Access.pdf); [IAPP GDPR–DMA mapping](https://iapp.org/resources/article/mapping-interplays-gdpr-dma). ByteDance (TikTok) offers a portability API and Meta relies on DYI/TYI — [Tech Policy Press](https://www.techpolicy.press/can-data-portability-shift-power-in-europes-digital-ecosystem/); [Meta DMA summary](https://www.dpo-india.com/Resources/Digital_Markets_Act(DMA)_EU/Meta-Compliance-with-Digital-Markets-Act.pdf)

### Inferences
- **Export upload** relies on the user's own GDPR Art. 20 / DMA right to their data. Niches only processes a file the user gives it. The file is personal data (saved history) and should be covered by Niches' privacy policy, processed minimally (ideally parsed on-device), and deletable.
- **Share-sheet link saving** stores a URL plus user metadata, the same as any bookmarking app. Low risk.
- **Embeds** are the platform-licensed way to show creator content, so prefer them anywhere content is visible to other users (shared boards, feeds).
- **Thumbnails/media**: downloading and re-hosting images or videos copies copyrighted works. A private, transient cache for a user's own bookmark grid is a common practice (Iframely recommends caching), but it is not explicitly authorized by either platform in what I found. Avoid storing videos at all, and avoid serving cached thumbnails publicly. "Download the actual video" tools such as tiktok-favesave or tikfav are a clear no for a commercial app.
- **Server-side fetching of Instagram/TikTok pages** for og:image or captions is automated collection. It is restricted by both platforms' terms even if *Bright Data* narrows breach-of-contract exposure for logged-off scraping. Treat it as a gray zone: at most, fetch on demand per user action at low volume, and don't build a crawler. AI caption extraction (ReciMe/Honeydew-style) almost certainly depends on such fetching or on the share text.
- This is not legal advice. Get counsel review before launching any thumbnail caching or caption extraction.

### Gaps
- I could not read the primary texts of Meta Platform Terms (sections on data storage/caching and embed display), Meta's Automated Data Collection Terms, TikTok Developer Terms, or TikTok Embed/Display policy (domains blocked). No clause-level citation on caching limits is available.
- The current status of any *Meta v. Bright Data* appeal was not checked.

## 6. Precedents (apps that already import from Instagram/TikTok)

### Takeaway
Consumer apps nearly all use the **share sheet → URL → enrichment (often AI)** pattern. Export-file import is found mainly in open-source and indie tools: Instagram → Raindrop CLI, personal-archive tools, and forensics tools. I found no mainstream app that imports Instagram or TikTok saved *collections* via an official API, because none exists.

### Cited Findings
- **ReciMe**: share TikTok/Instagram video → extracted recipe. The free tier allows 5 imports/week, it doesn't read comments, and it takes one recipe per post — [WhistleOut](https://www.whistleout.com/CellPhones/Apps/recime-app-review); [ReciMe site](https://www.recime.app/)
- **Honeydew**: Share → Honeydew from TikTok, AI extraction, and a screenshot import fallback for on-screen-only recipes — [Honeydew blog](https://honeydewcook.com/blog/recipe-importing-tiktok-grocery-list); [Honeydew 2026 roundup](https://honeydew-news.ghost.io/recipe-apps-social-media-imports/)
- Other roundups comparing social recipe importers (Peel, FoodiePrep and others) — [Peel blog](https://trypeel.app/blog/best-apps-to-save-recipes-from-instagram); [FoodiePrep](https://www.foodieprep.ai/blog/best-apps-for-saving-recipes-from-social-media); [cookbookmanager](https://cookbookmanager.com/post/best-apps-to-save-recipes-from-tiktok)
- **Raindrop.io**: saves Instagram via the browser extension. A user request says in-app manual add for Instagram links was removed and mobile saving is tedious. It imports Pinterest via file upload — [Raindrop feature board](https://better.raindrop.io/integrations/p/instagram-integration); [Raindrop Pinterest help](https://help.raindrop.io/integrations/pinterest.md)
- **Instagram export → Raindrop** community CLI (parses `saved_saved_collections`) — [dotWee/py-ig2raindrop-cli](https://github.com/dotWee/py-ig2raindrop-cli)
- Personal knowledge tools importing the IG saved export: [bramses/ycb-companion importer](https://github.com/bramses/ycb-companion/blob/main/src/components/importers/instagram-saved.tsx); [insta-boards (PyPI), which turns saved collections into boards](https://pypi.org/project/insta-boards/); [instagram-saved-mcp](https://pypi.org/project/instagram-saved-mcp/); [0dot77/media-tech-collection](https://github.com/0dot77/media-tech-collection/blob/main/CLAUDE.md)
- **mymind**: help docs describe tweet previews, with nothing found on Instagram/TikTok import — [mymind help](https://mymind.helpscoutdocs.com/article/61-what-type-of-things-can-i-save)

### Inferences
- The proven UX for "get my stuff from IG/TikTok" is share-sheet capture. Bulk historical import from exports is a differentiator few consumer apps offer, likely because the export flow takes several steps and gives only links.

### Gaps
- I couldn't confirm how Pinterest, Mela, Pestle, Flavorish, Matter or Readwise handle Instagram/TikTok specifically. Mela and Pestle are generally known as share-extension recipe importers, but no source was retrieved this session. Whether any app uses TikTok's Data Portability API for consumer import is unknown.

---

### Recommended approach (synthesis for the report writer; inference, based on the findings above)

**Early demo**
1. **"Share to Niches"** via `expo-share-intent` (dev build), or `expo-share-extension` if a board picker inside the extension is wanted. Accept the URL and normalize it (strip `igsh`, resolve TikTok short links). Save it into a chosen board.
2. **Display**: board grid cards. TikTok cards use the thumbnail and title from the public TikTok oEmbed. Instagram cards use a branded placeholder plus the owner handle and an optional user note. Tapping a card opens the official embed in a WebView (Instagram oEmbed is now tokenless, within 1,000 requests/hour per endpoint).
3. **Optional demo "wow"**: "Import from Instagram" using the user's own `saved_collections.json` / `saved_posts.json`, parsed on-device. IG collections map to Niches boards, so a "Cooking" collection becomes a "Cooking" board. For TikTok, import `user_data_tiktok.json` → Favorite Videos into an "Imported from TikTok" inbox for sorting. Use a demo account's real export to validate keys.
4. No scraping, no media downloads, no long-term thumbnail re-hosting.

**Later**
- Apply for Meta oEmbed Read (token, higher quota) as volume grows. Add server-side oEmbed caching with short TTLs and refresh.
- Apply for the TikTok Data Portability API (`portability.activity.*`, ongoing) for EEA/UK users to offer "keep my TikTok favorites in sync" (approval about 3–4 weeks; confirm the Data Types page lists Favorite Videos).
- Watch for a Meta DMA portability API. None was found as of 2026, and Meta relies on "Export Your Information".
- Consider AI auto-sorting of imported items into boards using only user-supplied or shared text and embed-visible metadata. Get legal review before any caption or thumbnail extraction from platform pages.
