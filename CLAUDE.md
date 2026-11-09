# Niches

A phone-first social app (web second) for Gen Z built around **niche feeds the user toggles between one at a time** — no mixed home feed. Pitch: **"You pick the niche. The feed ends. Likes are private."** Focus on connection, self-improvement and inspiration; no attention-bait.

The founder has little coding experience and wants to be involved: explain decisions in plain language and ask for their opinion on product and design choices before committing to them.

## Decisions so far

- **First version is a working demo** to show and test the idea.
- **Launch niche: Cooking.** Art, Photography and Gym are in the app as "coming soon". **Gym stays** (decided Nov 2026); goals track performance and habits (not weight), stats are hideable, and before/after photos sit behind a tap. Gardening is the leading candidate for the next niche, then Knitting & Crochet.
- **Feeds:** each niche feed shows *every* post in that niche, newest first, and ends with "You're caught up in Cooking". A "Following" filter comes later. One post belongs to exactly one niche. Remember the user's last niche.
- **Feed layout:** both a single-column Posts layout and a Pinterest-style Grid, with a Posts/Grid switch. Tapping a grid tile opens the normal post view (cheers, comments) with a back button to the grid.
- **Each niche has its own color — a must.** Cooking is basil green (#1E6B47); Art ultramarine; Photography amber; Gym raspberry. Switching niche re-tints the app. Mockups: https://claude.ai/artifact/7T9p36YdKk7gkBDfeQe6sm (founder approved the look; expect more feedback on real prototypes).
- **Niche marker outside Home:** on Discover and Saved (anywhere niches mix), each post gets a **border in its niche's color — border only, no label**. Keep the two tabs consistent.
- **Discover** = find people to follow + "inspiration this week" across niches the user filters for, ordered by most saved in the last 7 days. Never show the counts. Home stays newest-first.
- **Sheets/menus don't dim the screen behind them** (founder feedback).
- **Swipe left/right on Home switches niche like turning a page:** the next niche's feed slides in alongside the current one under your finger; header color blends between niches as you drag. Filter chips on Discover/Saved show their niche by a colored border (like the posts), not a swatch.
  Order: Cooking → Art → Photography → Gym. Tabs stay tap-only.
- **Demo has preview posts** from made-up founding creators in Art and Photography; those niches stay closed for posting. Gym has none.
- **Post "⋯" menu, like Instagram:** own posts — edit, adjust grid preview, hide cheer count, turn off comments, archive, delete; others' posts — save, not interested, report, copy link.
- **Niche colors are being explored:** a Color lab in Profile → Settings lets the founder try palettes per niche on device.
- **Profiles:** one profile per person with niche tabs (All · Cooking · Art ...).
- **Likes** (renamed from "cheers" in the UI; code still says `cheers`): counts hidden from everyone except the poster, who sees like and save counts on their own posts. No leaderboards.
- **Followers/following counts are shown on profiles, like Instagram** (founder's call, Nov 2026 — overrides the earlier research suggestion to defer them). Tapping a count opens the list of accounts.
- **Posts:** photos, text and video. Video is tap-to-play, no autoplay, no swipe-to-next feed, 60–90s cap.
- **Saved collections** (Pinterest-style boards) are a core feature, and can hold imported Instagram/TikTok saves: "Share to Niches" from the share sheet, plus one-time import of the user's Instagram/TikTok data export. No scraping, no re-hosting of their media.
- **Progress posts and goals** are a core feature.
- **Demo limits:** 18+, US only, no direct messages.
- **Users can request new niches** via feedback.
- **Notifications:** batched digest by default, real-time only for direct replies.

## Stack

Expo (React Native, Expo Router) for iOS, Android and web from one codebase; Supabase (Postgres, auth, storage, row-level security); Mux or Bunny Stream for video. TypeScript.

## Build order

1. Mockups of the main screens for founder feedback (including whether layout differs per niche: masonry grid vs. single-column posts)
2. App skeleton: sign-up (18+), bottom tabs (Home, Discover, Post, Saved, Profile), niche switcher
3. Posts, niche feeds with a real end, comments, private likes
4. Saved collections
5. Goals and progress posts
6. Safety basics: report, block, in-app account deletion, community guidelines (incl. AI-art and eating-disorder rules)
7. Share to Niches, Instagram/TikTok import, short video

## Roadmap the founder asked for (Nov 2026)

- **Phase A (demo polish):** post menu, Color lab, new Discover (people + inspiration), niche borders on Saved/Discover, swipe between niches.
- **Phase B, Plans:** one feature covering meal scheduling (shareable with friends), group meals where invitees pick a dish and claim who brings which ingredient, and photo/art outings (what + where + when). Each plan public or private.
- **Phase C, Shop ("Etsy meets Pinterest"):** users sell cookbooks, recipes, prints, artworks — **no food sales** (state cottage-food laws); listings attach to posts and are browsable per niche (Cooking, Photography, Art first). Demo checkout is pretend.
- **Phase D, Creators:** verified "celebrity" profiles and premium chefs/artists who charge a subscription or one-time fee for their best content. Same model for other niches. **Invite-only at first** (founder approves), open applications later. **Members-only posts appear in niche feeds and Discover only for people who can open them** (members, unlockers, the author); everyone else sees them locked on the creator's profile (`inFeeds()` in store). **Niches takes 5% of creator earnings** (founder confirmed Nov 2026; same as the Shop).
- **More niches:** founder likes Gardening; wants other popular hobby suggestions.
- C and D need real accounts (Supabase) and payments; mind Apple/Google rules on paid digital content.

## Where the build is

- Steps 1–2 done, plus a first pass of step 3: the Expo SDK 58 app (branch `app-skeleton`) has 18+ sign-up, tabs, niche switcher with per-niche colors, Cooking feed (Posts/Grid, real end, older posts behind a tap), post screen with back button, cheers/saves/comments with author-only stats, create post/progress/question, Saved, Profile, Discover with niche requests.
- Phase A done (Nov 2026): post ⋯ menu (`src/components/post-menu.tsx`, edit/preview screen `src/app/post/edit/[id].tsx`), Color lab (`src/app/settings/colors.tsx`; palettes in `src/lib/theme.ts`, every palette contrast-checked — screens must read colors via `useNiches()`, not the static `NICHES`), Discover with people/following/user profiles and weekly-saves inspiration, niche borders on Discover/Saved (and profile "All" tab), swipe between niches (`src/components/niche-swipe.tsx`, Gesture Handler v3 `usePanGesture`).
- Phase A feedback done: page-turn niche pager (`NichePager` keeps all niche pages mounted side by side; `useSwipeBlocked()` guards taps mid-swipe), likes (heart) with author-only like/save counts, followers/following counts + lists (`src/app/connections/[id].tsx`, demo follow graph `SEED_FOLLOWS`), color-theory schemes + distinctness rating in the Color lab (`SCHEMES`, `distinctness()` in theme.ts).
- Phase B Plans done in the demo: `src/lib/plans.ts` (model, seed, date helpers), screens `src/app/plans/{index,new,[id]}.tsx`, `PlanCard`. Entry points: calendar button in the Home header, profile "Your upcoming plans", link at top of the Post tab. Kinds: Meal, Cook together (dish ideas + votes, host picks; ingredients to claim), Outing (named Shoot/Art session/Workout per niche). Private (owner + invitees) or Public (on profile, anyone can join). Plan cards use the niche-color border like other mixed-niche lists.
- Phase C Shop done in the demo (Nov 2026): `src/lib/shop.ts` (listings, cart, orders, 5% seller-paid fee `FEE_RATE`, seed listings from demo sellers), `src/components/shop.tsx` (ListingTile/ListingGrid with price tag + digital badge, `ShopThisBar` under posts with a linked listing, `NicheShop`), screens `src/app/shop/{[id],cart,orders,new}.tsx`. Home has a Feed | Shop switch on Cooking/Art/Photography (`homeMode`). Checkout is pretend ("Demo: no money was charged"), one order per seller. Selling requires "my own work" and, in Cooking, "this isn't food". Shop items show on Saved ("From the shops"), Discover ("From the shops", best sellers) and a profile "Shop" tab, with niche borders. Digital goods are flagged for the Apple in-app purchase question when real payments come.
- Phase D Creators done in the demo (Nov 2026): `src/lib/creators.ts` (est. 15% app store fee `STORE_FEE_RATE`, Niches 5% `CREATOR_FEE_RATE`, `creatorTake()`), `User.verified` (blue check) and `User.membership` (premium creator: monthly price, tagline, perks), `Post.premium` + optional `unlockCents`. `hasAccess()` in store decides locking; locked posts show a "Members only" preview in feeds/grids/profile and hide comments. `src/components/creator.tsx`: `Badges`/`NameWithBadges`, `JoinSheet` (pretend payment: membership or one-time unlock), `LockedPanel`, `MembershipCard`. Screens `src/app/creators/{apply,studio,memberships}.tsx`. Invite-only: users request an invite; a "Demo: approve my invite" button stands in for the founder approving. Demo creators are fictional (chef.ines, daxcooks verified + premium; rosa.paints, nadia.frames premium). Discover has a "Featured creators" row.
- Real photos (Nov 2026): `src/lib/photos.ts` `pickPhoto()` (expo-image-picker → resized to 1440px JPEG with expo-image-manipulator → copied into the app's documents folder on phones; inline data URI on web). `Post.imageUri`/`imageAspect`, `Listing.imageUri`, `User.avatarUri` (tap your own avatar on Profile). `MediaPlaceholder` shows the real photo when present; seed content still uses color blocks. Feeds show photos at their natural shape between 4:5 and 5:4.
- Data is on-device only (`src/lib/store.tsx`, AsyncStorage) with demo content in `src/lib/seed.ts`. Next: Supabase behind the same store actions, then real photo upload, boards, goals.
- This cloud environment blocks docs.expo.dev and Expo's version API: use `EXPO_OFFLINE=1 npx expo install <pkg>` and read types in `node_modules` for API details. `npx expo lint` can't fetch its config here.
- Smoke-test by exporting web (`CI=1 EXPO_OFFLINE=1 npx expo export -p web`), serving `dist/` with an SPA fallback, and driving it with Playwright at 390×844.

## Reference material

- `docs/research/` — research report and notes (Gen Z attitudes, case studies, humane design, import feasibility, cold start and safety, tech stack). Read the report before making product decisions.
- `docs/design-references/` — DESIGN.md files (Pinterest, Airbnb, Expo) from VoltAgent/awesome-design-md, for reference only; Niches should have its own look.
- `.claude/skills/` — design skills: taste-skill, impeccable (includes `polish`), and Emil Kowalski's emil-design-eng, animate-expo, review-animations, find-animation-opportunities, break-ui, prototype. Licenses in `.claude/skills/_licenses/`.
