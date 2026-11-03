# Tech Stack for "Niches" (solo founder, AI coding agent in a cloud Linux container)

> Research method note (Nov 3, 2026): Direct page fetches to expo.dev, supabase.com, mux.com and developers.cloudflare.com were BLOCKED by this session's network allowlist (DNS failure). All findings below come from web-search result snippets, which often quote official pages (expo.dev changelog, docs.expo.dev, supabase.com docs, firebase.google.com/pricing, developer.apple.com, bunny.net docs) but in some cases rely on third-party blogs. Every pricing number should be re-checked on the vendor page before budgeting. Where sources conflict, it is flagged.

**Bottom-line recommendation (synthesized from findings below):** Expo (React Native, current SDK 57 / RN 0.86, New Architecture only) + Expo Router (iOS/Android/web from one codebase) + Supabase (Postgres + Auth + Storage + RLS + Realtime) + a managed video API (Mux for best developer experience, or Bunny Stream for lowest cost; Cloudflare Stream as a middle option) + FlashList v2 (with `masonry` prop for Pinterest-style boards) + expo-image + expo-video + Reanimated + NativeWind (stable v4) for styling. Distribute to testers with EAS Build (cloud builds, no Mac needed) → TestFlight (iOS) and Google Play internal/closed testing (Android), and push JS-only changes with EAS Update. Estimated demo cost: roughly $35–$100/month plus $99/yr Apple and $25 one-time Google.

## 1. Frontend framework: Expo/React Native vs Flutter vs native Swift/Kotlin vs PWA/Next.js

### Takeaway
Expo/React Native is the best fit: one TypeScript codebase for iOS, Android and web (via Expo Router), a mature cloud build/update pipeline (EAS) that removes the need for a Mac, and the largest body of AI-training data (JS/React), which matters most for a non-coder steering an AI agent. Flutter is a credible second choice (strong performance), but Dart has less AI training data and the web/share-extension story is not better; native Swift+Kotlin means two codebases plus a Mac requirement; a PWA cannot do iOS share-sheet extensions or feel fully native.

### Cited Findings
**Expo / React Native versions & maturity (2025–2026)**
- Expo SDK 55 (announced Feb 24–25, 2026) removed the Legacy Architecture entirely: SDK 55+ projects cannot use it and the `newArchEnabled` app.json option was removed; it shipped React Native 0.83; it also added "agent skills" in the `expo/skills` repo and made EAS queryable through the Expo MCP (i.e., explicit AI-agent tooling) — [Expo changelog SDK 55](https://expo.dev/changelog/sdk-55)
- Expo SDK 56 shipped May 21, 2026 with React Native 0.85 and React 19.2; Expo UI SwiftUI/Jetpack Compose APIs marked stable; ~16% faster clean iOS builds via prebuilt XCFrameworks; Hermes v1 on by default, with a noted memory regression affecting apps using react-native-worklets / react-native-reanimated — [Expo changelog SDK 56](https://expo.dev/changelog/sdk-56); [AlternativeTo](https://alternativeto.net/news/2026/5/expo-sdk-56-brings-stable-expo-ui-faster-builds-and-react-native-0-85/)
- Expo SDK 57 released June 30, 2026: React Native 0.86 (described as having no breaking changes), React still 19.2, Reanimated 4.3→4.5; the Hermes v1 memory regression fixed in expo@57.0.9; expo@57.0.23 adds opt-in Xcode 27 scene support; Expo says it is "exploring a new Expo SDK release cadence" with non-breaking upgrades between bigger releases — [Expo changelog SDK 57](https://expo.dev/changelog/sdk-57); [releases.sh](https://releases.sh/release/rel_aH7NaXbDXMlY2_I-Ak0D0)
- RN 0.82 (Oct 8, 2025) was reportedly the first RN version to run exclusively on the New Architecture — [pasqualepillitteri.it (blog)](https://pasqualepillitteri.it/en/news/8279/react-native-2026-stack-choices-vs-flutter)
- Blog comparisons say the New Architecture brings RN performance "close to Flutter for most real-world use cases," while Flutter pulls ahead for graphics-heavy apps (games, custom canvas) — [groovyweb (blog)](https://www.groovyweb.co/blog/react-native-vs-flutter-vs-expo-vs-lynx-2026); [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/8279/react-native-2026-stack-choices-vs-flutter)

**AI-agent friendliness**
- Comparisons note AI assistants are trained on enormous amounts of React/React Native code, while "Dart has less training data in AI code assistants compared to JavaScript or Python" — [groovyweb (blog)](https://www.groovyweb.co/blog/guide-to-build-a-react-native-app/); [DEV Community](https://dev.to/krunal_groovy/react-native-vs-flutter-vs-expo-vs-lynx-2026-which-to-choose-for-your-app-30h6)
- A claim that AI-generated RN code is "consistently better" than generated Flutter code comes from buildr, a vendor that only ships RN scaffolds (biased) — [buildr](https://buildr-sh.pages.dev/posts/expo-vs-flutter-2026.html)
- Expo itself ships agent skills (`expo/skills`) and an Expo MCP for querying EAS (SDK 55) — [Expo changelog SDK 55](https://expo.dev/changelog/sdk-55)

**Share-sheet extension (saving Instagram/TikTok links into collections)**
- Official `expo-sharing` now supports *receiving* data from other apps on Android and iOS, and it is included in Expo Go; `useIncomingShare()` returns shared data; shared web URLs can be "resolved" with extra info about the URL contents (needs network); with Expo Router a `+native-intent.ts` file can redirect incoming shares to a handler route — [Expo docs: Sharing](https://docs.expo.dev/versions/latest/sdk/sharing.md)
- Community `expo-share-intent` handles URL, text, images, videos and files on both platforms via a config plugin; it uses native code so it does NOT work in Expo Go (needs a development build); for a custom iOS share UI the repo points to the separate `expo-share-extension` package — [expo-share-intent on npm](https://npmjs.com/package/expo-share-intent); [GitHub achorein/expo-share-intent](https://github.com/achorein/expo-share-intent//blob/master/)
- Unclear from docs whether `expo-sharing` gives the same full iOS share-extension setup (custom share sheet UI) as the community packages — [Expo docs: Sharing](https://docs.expo.dev/versions/latest/sdk/sharing.md)

**Tester access paths (detail in Q4)**
- `npx expo start --tunnel` gives a tunneled dev URL for restrictive networks (relevant for a cloud container) — [Expo docs: development workflows](https://docs.expo.dev/develop/development-builds/development-workflows/)
- EAS Update publishes JS/asset bundles to channels that development/preview builds load without a dev machine running; qr.expo.dev generates QR codes to load a channel's latest update; builds only load updates with a matching `runtimeVersion` — [Expo docs: development workflows](https://docs.expo.dev/develop/development-builds/development-workflows.md); [Expo docs: QR codes](https://docs.expo.dev/more/qr-codes)

### Inferences
- Comparison summary for Niches:
  - **Expo/RN (recommended):** one TS codebase for iOS/Android/web via Expo Router; cloud builds from Linux; OTA updates for testers; best AI-agent coverage; share-intent supported (needs dev build, not Expo Go, for the full extension). Trade-off: web output is "good enough" for secondary web, not SEO-perfect; occasional SDK upgrades (≈3/yr) and Hermes/Reanimated regressions like SDK 56's.
  - **Flutter:** single codebase, strong rendering, good web for app-like UIs; weaker AI training data (Dart); share extensions require native iOS code; no equivalent of Expo Go/EAS Update built in (third-party Shorebird exists, not researched here).
  - **Native Swift + Kotlin:** best platform fidelity and easiest share extensions, but two codebases + separate web; iOS builds require Xcode/macOS (or a cloud Mac CI) — poor fit for a solo non-coder in a Linux container.
  - **PWA/Next.js:** fastest to a web demo and testable via a URL, but iOS PWAs cannot register as share-sheet targets (Web Share Target API is not supported on iOS Safari — from prior knowledge, not re-verified this session), push/camera/video-upload UX is weaker, and no App Store presence.
- Because Expo Go only supports a specific SDK and cannot include custom native code (share intent), the realistic tester path is a "preview" development/internal build via EAS, not Expo Go, once share-to-Niches is added. Expo Go is still fine for the first week of UI prototyping.
- Pin to Expo SDK 57 now (current stable as of Nov 2026 per sources found). An SDK 58 may appear late 2026/early 2027 — not found in search; flag as possibly outdated.

### Gaps
- No independent benchmark of AI coding-agent output quality for Expo vs Flutter was found; evidence is blog/vendor opinion.
- State of React Native survey 2025 results were not retrieved (network blocked; not searched due to call budget).
- Could not confirm whether an Expo SDK 58 had shipped by Nov 2026.
- iOS PWA Web Share Target support not re-verified in this session.

## 2. Backend: Supabase vs Firebase vs Convex vs PocketBase vs Appwrite

### Takeaway
Supabase is the best fit: a social graph (follows, niche feeds, comments, saved collections, goals) is naturally relational, and Postgres + row-level security + a `feed` SQL view/RPC handles "chronological posts from people I follow in niche X" in one query. Free tier is fine for building; move to Pro ($25/mo) before inviting testers to avoid the 1-week inactivity pause and to unlock image transformations. Firebase now requires the pay-as-you-go Blaze plan for Cloud Storage and is NoSQL (feeds need fan-out/denormalization); Convex is good but per-developer pricing and a less-standard data model; PocketBase/Appwrite are viable but smaller ecosystems.

### Cited Findings
**Supabase**
- Free: 500 MB database, 50,000 MAU, 5 GB egress, 500 MB (1 GB in some sources) file storage; free projects auto-pause after 1 week of inactivity — [jetadmin (blog)](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/); [makerkit (blog)](https://makerkit.dev/blog/saas/supabase-pricing); [activepieces](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress.md)
- Pro: $25/month base (sources disagree on whether billed per organization or per project); includes 8 GB DB, 100 GB storage, 250 GB egress, 100,000 MAU; compute billed separately minus a $10 compute credit; overages per unit. Team is $599/month — [makerkit](https://makerkit.dev/blog/md/saas/supabase-pricing); [nocode.mba](https://www.nocode.mba/articles/supabase-pricing); [toolradar](https://toolradar.com/blog/supabase-pricing-2026)
- Image transformations: Pro includes 100 origin images per billing cycle; overage $5 per 1,000 origin images; charged per distinct source image regardless of how many size variants; "Image Resizing is currently enabled for Pro Plan and above" (pricing table ambiguously shows it under Free — conflict) — [Supabase docs: image transformations usage](https://supabase.com/docs/guides/platform/manage-your-usage/storage-image-transformations); [Supabase docs: image transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- Supabase described as the relational default, suited to follow graphs/joins; flat tiers easier to budget than Firebase — [devtoolpicks](https://devtoolpicks.com/blog/convex-vs-supabase-vs-firebase-indie-hackers-2026); [DEV Community](https://dev.to/royce_fabbd83cb268312e928/convex-vs-supabase-vs-firebase-for-saas-starters-2026-jnb)

**Firebase**
- Official pricing table lists Cloud Storage as "Not applicable" on the free Spark plan; on Blaze, no-cost up to 5 GB stored then $0.10/GB, and 50K/day download operations free; quotas are per project — [Firebase pricing](https://firebase.google.com/pricing)
- Since Feb 3, 2026, creating/maintaining a Storage bucket requires a linked billing account (Blaze), per a DEV guide; a regional Firebase page mentions a 10 GB no-cost Storage figure effective Sept 1, 2026 (conflicting/unclear) — [DEV Community](https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb); [firebase.google.cn pricing](https://firebase.google.cn/pricing)
- Blaze has no fixed fee but usage billing "can spike unpredictably," with no spending cap by default — [devtoolpicks](https://devtoolpicks.com/blog/convex-vs-supabase-vs-firebase-indie-hackers-2026)

**Convex**
- Free tier ≈ 1M function calls/month, 0.5 GB database, 1,000 concurrent sessions; paid pricing is per developer (~$25/dev/month) — [dev.to comparison](https://dev.to/_6638a39c349d7e9c85ee20/best-backend-as-a-service-platforms-2026-supabase-vs-appwrite-vs-convex-vs-firebase-3j7b); [toolradar](https://toolradar.com/tools/convex/pricing)
- Positioned as the pick for realtime-first apps — [devtoolpicks](https://devtoolpicks.com/blog/convex-vs-supabase-vs-firebase-indie-hackers-2026)

**Appwrite / PocketBase**
- Appwrite Pro price conflicts: $25/month in several 2026 summaries vs $15/month (Toolradar, "verified Sept 2026") — [xpay](https://www.xpay.sh/saas-pricing/appwrite-io/); [Toolradar](https://toolradar.com/tools/appwrite-2-0/pricing)
- Appwrite Free (third-party): 75,000 MAU, 5 GB bandwidth, 2 GB storage, 750K function executions; per-project caps of 1 database, 1 bucket, 2 functions; self-hosted Appwrite is free/open source — [toolquestor](https://toolquestor.com/vs/convex-vs-appwrite); [xpay](https://www.xpay.sh/agent-ready-index/appwrite-io/); [Appwrite pricing](https://appwrite.io/pricing)
- Appwrite also bills image transformations separately (pricing announced 2025) — [Appwrite blog](https://appwrite.io/blog/post/announcing-image-transformations-pricing)

### Inferences
- Data model sketch for Supabase: `profiles`, `follows(follower_id, followee_id)`, `niches`, `posts(author_id, niche_id, type photo|text|video|progress, created_at)`, `post_media`, `comments`, `likes` (RLS: only post author can read like counts → "hidden likes"), `collections`, `collection_items(post_id | external_url, og_title, og_image)`, `goals`/`goal_updates`, `notifications`. Chronological niche feed = `SELECT ... FROM posts JOIN follows ... WHERE niche_id = $1 ORDER BY created_at DESC` with keyset pagination and an index on (niche_id, created_at); trivial at 100–500 testers.
- Notifications: insert rows via Postgres triggers + send Expo push via an Edge Function (Expo push service is free — not re-verified this session).
- The 100 origin-image transform quota is small; for a demo, prefer client-side resizing (expo-image-manipulator) before upload and serve originals via expo-image caching, or accept ~$5/1,000 images overage.
- Firebase's Storage-requires-Blaze change removes its "free forever" advantage for a photo/video app.
- PocketBase (single Go binary, SQLite) is cheap to self-host but requires running a server (ops burden for a non-coder) — no 2026 pricing/hosting sources found.

### Gaps
- Supabase egress overage price and compute tier prices not retrieved (supabase.com blocked).
- Whether Supabase Pro $25 is per org or per project (sources conflict).
- PocketBase hosting options/costs not found in search.
- Supabase Realtime limits per plan not retrieved.

## 3. Video hosting for user-uploaded clips (≤60–90 s)

### Takeaway
For a demo, use a managed video API rather than raw files: Mux has the best developer experience and docs (good for an AI agent) with a free plan for prototyping and low per-minute rates; Cloudflare Stream is simple flat per-minute pricing ($5/1,000 min stored, $1/1,000 min delivered); Bunny Stream is cheapest by far (per-GB billing, free transcoding) but slightly more DIY. Cap clips at 60–90 s and 720p to keep costs trivial. At demo scale all three cost single-to-low-double-digit dollars per month.

### Cited Findings
- **Mux:** Free plan = up to 10 on-demand videos stored + 100,000 delivery minutes/month, no credit card — [Mux blog](https://www.mux.com/blog/story/pricing); [toolradar](https://toolradar.com/tools/mux/pricing)
- Mux official rates (snippet): storage $0.003/min/month, delivery $0.00096/min; encoding free on basic tier. Conflicting figures elsewhere: $0.001/min delivery; or $0.0024 storage / $0.0008 delivery (calculator, Aug 2026). Rates vary by resolution and volume. Mux announced a price drop July 17, 2025 — [Mux pricing](https://www.mux.com/pricing/video); [Mux blog price drop](https://www.mux.com/blog/price-drop); [apicostcalc](https://apicostcalc.com/mux-vs-cloudflare-stream-vs-bunny-stream-cost-calculator.html)
- Mux "Launch" plan reportedly $20/month with $100 usage credit (third-party; conflicts with a "$20 usage credit on pay-as-you-go" mention in Mux docs) — [toolradar](https://toolradar.com/tools/mux/pricing); [Mux docs pricing](https://www.mux.com/docs/pricing)
- **Cloudflare Stream (official docs):** storage prepaid in $5 increments per 1,000 minutes stored (regardless of file size); delivery $1 per 1,000 minutes delivered; encoding free; no free delivery allowance — [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/index.md)
- A competitor blog (BlazingCDN) states the Cloudflare rates reversed — contradicts Cloudflare's own docs; discount it — [BlazingCDN](https://blog.blazingcdn.com/en-us/cloudflares-pricing-for-video-streaming-services)
- **Bunny Stream:** transcoding, player and security features listed as free; storage $0.01/GB/month (primary region); delivery "from $0.005/GB," with docs listing $0.010/GB for Europe/North America standard network and $0.060/GB Middle East/Africa; $1 monthly minimum, 14-day free trial; some reviews mention a paid premium encoding tier (~$0.05/min 1080p) — [Bunny Stream pricing](https://bunny.net/pricing/stream/); [Bunny docs: Stream pricing](https://docs.bunny.net/stream/pricing); [swarmify](https://swarmify.com/blog/bunny-stream-review/); [devtoolpicks](https://devtoolpicks.com/blog/best-mux-alternatives-indie-hackers-2026); [theguidex](https://theguidex.com/best-cdn-for-video-streaming)
- Third-party calculators say Bunny usually wins at high delivered-minute volumes because it bills per GB, not per minute — [apicostcalc](https://apicostcalc.com/mux-vs-cloudflare-stream-vs-bunny-stream-cost-calculator.html)

### Inferences
- Worked demo estimate (assumptions: 500 testers, ~150 daily actives each watching ~10 min of video/day → ~45,000 delivered min/month; ~300 clips × 1 min = 300 stored min):
  - Mux: storage 300 × $0.003 ≈ $0.90; delivery 45,000 × $0.00096 ≈ $43 — or ~$0 if the 100K free delivery minutes apply on the paid tier (unclear; one calculator says they apply monthly). The free plan's 10-video cap is too small for 100+ testers.
  - Cloudflare: $5 (first 1,000 stored min) + 45 × $1 = ~$50.
  - Bunny: 720p ≈ ~15 MB/min (assumption ~2 Mbps) → ~675 GB × $0.01 ≈ $7 + storage pennies, $1 minimum.
  - At 100 testers, divide delivery by ~5 → Mux ~$0–10, Cloudflare ~$14, Bunny ~$1–2.
- Recommendation: start on Mux (free plan while building; best SDK/docs, direct uploads, auto thumbnails) and switch to pay-as-you-go when testers arrive; choose Bunny if minimizing cost matters more than developer experience. Avoid raw MP4 in Supabase Storage for anything beyond tiny demos: no adaptive bitrate/transcoding, and egress counts against the 250 GB Pro allowance (the ~675 GB example above would exceed it).
- Enforce limits client-side (expo-image-picker `videoMaxDuration` 90 s, quality 720p) and server-side (reject longer assets via webhook).
- api.video was not researched (call budget).

### Gaps
- Mux exact current rates and whether the free 100K delivery minutes continue on paid plans (official page blocked; sources conflict).
- api.video pricing not researched.
- Supabase egress overage rate not retrieved.

## 4. Developing an Expo app from a cloud Linux container (no Mac) and getting it onto testers' phones

### Takeaway
Fully feasible: the agent writes code in the container, previews via Expo web export + Playwright screenshots, uses `npx expo start --tunnel` for live testing in Expo Go/dev builds, and EAS Build compiles iOS/Android in Expo's cloud (no Mac). Testers get iOS via TestFlight (external testers need Beta App Review, typically ~1–2 days for the first build) and Android via Play Console internal testing (instant) or a direct APK link; JS changes ship instantly with EAS Update. Watch out for Google's 12-tester/14-day closed-test rule before any public Play Store launch.

### Cited Findings
**EAS Build / Update pricing**
- EAS Free plan: 30 mobile builds/month (one third-party guide says 15 Android + 15 iOS), low-priority queue; EAS Update free for 1,000 MAU — [Expo pricing](https://expo.dev/pricing.md); [newly.app guide (Sept 2026)](https://newly.app/guides/eas-build); [Expo billing FAQ](https://docs.expo.dev/billing/faq)
- Starter plan: $19/month, includes $45 of build credit for priority builds and 3,000 EAS Update MAU — [Expo billing plans](https://docs.expo.dev/billing/plans/); [Expo billing FAQ](https://docs.expo.dev/billing/faq.md)
- Free-plan builds stop when the quota is used until the 1st of next month; paid plans bill extra builds usage-based — [Expo billing FAQ](https://docs.expo.dev/billing/faq)
- Production plan price conflicts: $99/month (cached) vs $199/month (live snippet) — [Expo pricing](https://expo.dev/pricing)

**Dev loop in a container**
- `npx expo start --tunnel` provides a tunneled URL when network conditions prevent a LAN connection — [Expo docs: development workflows](https://docs.expo.dev/develop/development-builds/development-workflows/)
- EAS Update + channels + qr.expo.dev QR codes let testers with a preview/dev build load the latest bundle without the dev machine running; runtimeVersion must match — [Expo docs: QR codes](https://docs.expo.dev/more/qr-codes); [Expo docs: development workflows](https://docs.expo.dev/develop/development-builds/development-workflows.md)
- Native-code packages such as expo-share-intent require a development build, not Expo Go — [expo-share-intent npm](https://npmjs.com/package/expo-share-intent)

**iOS: TestFlight**
- Up to 10,000 external testers per app; public link can cap testers (1–10,000) and be deactivated anytime — [Apple App Store Connect Help](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers); [Apple TestFlight](https://developer.apple.com/testflight/)
- External testing requires a beta description and Beta App Review info; first build of each version is reviewed; reported turnaround ~24 h (4–48 h) or 1–2 days (third-party); builds reportedly expire after 90 days (third-party, not confirmed on Apple page) — [Apple TestFlight](https://developer.apple.com/testflight/); [techconcepts](https://techconcepts.org/blog/testflight-guide); [newly.app](https://newly.app/guides/ios-testflight)
- Sources conflict on external group limits (25 vs 100 groups) — [webtonative](https://www.webtonative.com/blog/how-to-invite-testers-to-testflight)

**Android: Google Play**
- Personal developer accounts created after Nov 13, 2023 must run a closed test with ≥12 testers opted-in for 14 continuous days before publishing to production (reduced from 20 in Dec 2024); organization accounts with a D-U-N-S number are exempt; internal testing doesn't count toward it; some sources claim 2026 engagement checks — [Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB); [testerscommunity](https://www.testerscommunity.com/blog/google-play-closed-testing-requirements-2026); [DEV Community](https://dev.to/theionproject/the-12-tester-rule-that-quietly-adds-two-weeks-to-your-first-google-play-launch-4bp3)

### Inferences
- Suggested tester rollout:
  1. Week 1–2: build UI with Expo web (`npx expo start --web` / `npx expo export --platform web`) and have the agent take Playwright screenshots at phone viewport sizes; founder tries on own phone via Expo Go + `--tunnel`.
  2. Once native modules (share intent, push) are added: `eas build --profile preview` → Android APK installable via link (no Play account needed for a handful of testers); iOS internal distribution (ad hoc, needs device UDIDs) or straight to TestFlight.
  3. For 100–500 testers: `eas build --profile production` + `eas submit` → TestFlight external group with a public link; Android Play Console internal testing (up to 100 testers — from prior knowledge, not re-verified) or closed testing (unlimited, and starts the 12-tester/14-day clock).
  4. Day-to-day: `eas update --channel preview` pushes JS fixes to all testers instantly without re-review.
  5. Web: `npx expo export -p web` deployed to EAS Hosting / Vercel / Netlify as a zero-install link for curious testers.
- A Google Play organization account (needs D-U-N-S) avoids the 12-tester rule if the founder forms a company; otherwise start a closed test early so the 14-day clock runs during the demo.
- Apple Developer Program ($99/yr) and Google Play ($25 one-time) fees are as stated in the assignment brief; not re-verified this session. An Apple account is required for TestFlight and for EAS to manage signing credentials.

### Gaps
- Whether `--tunnel` still relies on ngrok or an Expo-hosted tunnel in SDK 57 (not confirmed).
- Apple/Google fee amounts and Play internal-testing 100-tester cap not re-verified (blocked/budget).
- Expo Production plan price ($99 vs $199) unresolved.

## 5. UI libraries for an Instagram/Pinterest-like look

### Takeaway
Use FlashList v2 for all feeds (and its `masonry` prop for Pinterest-style saved collections), expo-image for cached photos, expo-video for clips, Reanimated (+ Gesture Handler) for double-tap/sheets/transitions, and NativeWind v4 (stable) for Tailwind-style styling that AI agents write fluently. Tamagui and Gluestack are viable but add complexity or are mid-migration.

### Cited Findings
- FlashList v2 is New-Architecture-only (fine, since Expo SDK 55+ is New-Arch-only); `MasonryFlashList` is deprecated and masonry is now a `masonry` prop on `FlashList` with `numColumns`; no `estimatedItemSize` needed; `overrideItemLayout` supports column spans only — [FlashList GitHub](https://github.com/Shopify/flash-list); [FlashList v2 migration](https://shopify.github.io/flash-list/docs/v2-migration); [Shopify Engineering: FlashList v2](https://shopify.engineering/flashlist-v2)
- Expo SDK 57 bundles Reanimated 4.5 — [Expo changelog SDK 57](https://expo.dev/changelog/sdk-57)
- Expo UI (SwiftUI/Jetpack Compose components) became stable in SDK 56, with universal components across Android, iOS and web — [Expo changelog SDK 56](https://expo.dev/changelog/sdk-56)
- NativeWind v4 (on Tailwind 3.x) is described as the stable production version as of April 2026; v5 (Tailwind v4) status unconfirmed — [reactnativerelay](https://reactnativerelay.com/sv/article/styling-i-react-native-2026-komplett-guide-nativewind-tailwind-css)
- Gluestack UI's active line is a v5 alpha built on NativeWind v5/Tailwind v4 (the v4 branch was dropped); its CLI can migrate to Uniwind — [gluestack-ui discussion #3366](https://github.com/gluestack/gluestack-ui/discussions/3366)
- Tamagui: compiler-driven styling that flattens styles at build time; recommended for universal web+native apps with performance demands — [pkgpulse](https://www.pkgpulse.com/guides/nativewind-vs-tamagui-vs-twrnc-react-native-styling-2026)

### Inferences
- Suggested package set: `expo-router`, `@shopify/flash-list` v2, `expo-image`, `expo-video`, `expo-image-picker`, `expo-image-manipulator`, `react-native-reanimated`, `react-native-gesture-handler`, `@gorhom/bottom-sheet` (not researched), `nativewind`, `@supabase/supabase-js`, `@tanstack/react-query` (not researched), Mux upload via direct-upload URL, `expo-notifications`, `expo-sharing` or `expo-share-intent`.
- Niche toggle (Cooking/Art/Photography/Gym one at a time) = a segmented control/top tab in Expo Router; each niche feed a FlashList keyed by niche to reset scroll.
- Avoid Gluestack v5 alpha for a demo (churn); NativeWind v4 is the low-risk choice.

### Gaps
- No independent performance benchmarks for NativeWind/Tamagui found.
- expo-video and expo-image specifics for SDK 57 not retrieved.

## 6. Approximate monthly cost for a demo with ~100–500 testers

### Takeaway
Roughly $30–$50/month at 100 testers and $45–$100/month at 500 testers, plus Apple $99/yr and Google $25 one-time; most of the variable is video delivery.

### Cited Findings
- Supabase Pro $25/month (includes 100K MAU, 8 GB DB, 100 GB storage, 250 GB egress, $10 compute credit) — [makerkit](https://makerkit.dev/blog/md/saas/supabase-pricing)
- Supabase image transformation overage $5 per 1,000 origin images beyond 100 — [Supabase docs](https://supabase.com/docs/guides/platform/manage-your-usage/storage-image-transformations)
- EAS Free $0 (30 builds/month, 1,000 Update MAU) or Starter $19/month (3,000 Update MAU, $45 build credit) — [Expo billing plans](https://docs.expo.dev/billing/plans/); [Expo billing FAQ](https://docs.expo.dev/billing/faq.md)
- Video: Mux ~$0.003/min stored + ~$0.00096/min delivered; Cloudflare $5/1,000 stored + $1/1,000 delivered; Bunny ~$0.01/GB storage + $0.005–0.01/GB delivery — [Mux pricing](https://www.mux.com/pricing/video); [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/index.md); [Bunny docs](https://docs.bunny.net/stream/pricing)

### Inferences
- Line items (100 testers / 500 testers):
  - Supabase Pro: $25 / $25 (Free tier possible at 100 testers, but the 1-week inactivity pause and lack of image transforms make Pro worth it once testing starts)
  - Image transforms: $0–5 / $5–10 (or $0 if resizing client-side)
  - EAS: $0 / $19 (Free plan's 1,000 Update MAU covers 500 testers; Starter mainly for priority build queue)
  - Video: Mux ~$0–10 / ~$0–45; Bunny ~$1–2 / ~$7; Cloudflare ~$10–15 / ~$50
  - Web hosting (EAS Hosting/Vercel/Netlify free tiers): ~$0 (not researched)
  - Push notifications (Expo push): $0 (not re-verified)
  - Apple $99/yr ≈ $8.25/mo; Google $25 one-time
  - **Total ≈ $35–50/mo (100 testers) and ≈ $45–100/mo (500 testers)**, excluding AI-agent subscription costs.
- Biggest cost risks: video delivery if testers binge; Supabase egress if raw videos are stored there; Firebase-style surprise bills (avoided by choosing Supabase's flat tier + spend cap).

### Gaps
- Supabase spend cap behavior and egress overage price not confirmed this session.
- Expo push notification service pricing and EAS Hosting pricing not researched.
- All video numbers depend on assumed viewing behavior and bitrate.
