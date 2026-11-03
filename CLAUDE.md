# Niches

A phone-first social app (web second) for Gen Z built around **niche feeds the user toggles between one at a time** — no mixed home feed. Pitch: **"You pick the niche. The feed ends. Likes are private."** Focus on connection, self-improvement and inspiration; no attention-bait.

The founder has little coding experience and wants to be involved: explain decisions in plain language and ask for their opinion on product and design choices before committing to them.

## Decisions so far

- **First version is a working demo** to show and test the idea.
- **Launch niche: Cooking.** Art, Photography and Gym are in the app as "coming soon". Gym is undecided because of body-image risk; if kept, goals track performance and habits (not weight), stats are hideable, and before/after photos sit behind a tap.
- **Feeds:** each niche feed shows *every* post in that niche, newest first, and ends with "You're caught up in Cooking". A "Following" filter comes later. One post belongs to exactly one niche. Remember the user's last niche.
- **Feed layout:** both a single-column Posts layout and a Pinterest-style Grid, with a Posts/Grid switch. Tapping a grid tile opens the normal post view (cheers, comments) with a back button to the grid.
- **Each niche has its own color — a must.** Cooking is basil green (#1E6B47); Art ultramarine; Photography amber; Gym raspberry. Switching niche re-tints the app. Mockups: https://claude.ai/artifact/7T9p36YdKk7gkBDfeQe6sm (founder approved the look; expect more feedback on real prototypes).
- **Profiles:** one profile per person with niche tabs (All · Cooking · Art ...).
- **Likes:** hidden from everyone except the poster. Replacement feedback: comments, a one-tap cheer, "saved to N collections". No leaderboards or follower-count ranking.
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

## Reference material

- `docs/research/` — research report and notes (Gen Z attitudes, case studies, humane design, import feasibility, cold start and safety, tech stack). Read the report before making product decisions.
- `docs/design-references/` — DESIGN.md files (Pinterest, Airbnb, Expo) from VoltAgent/awesome-design-md, for reference only; Niches should have its own look.
- `.claude/skills/` — design skills: taste-skill, impeccable (includes `polish`), and Emil Kowalski's emil-design-eng, animate-expo, review-animations, find-animation-opportunities, break-ui, prototype. Licenses in `.claude/skills/_licenses/`.
