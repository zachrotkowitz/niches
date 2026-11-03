# Niches

A social app where you pick the niche, the feed ends, and likes are private.

Instead of one mixed home feed, you switch between niche feeds (starting with Cooking) and only see that niche. Saved collections bring your saves from Niches, Instagram and TikTok into one place.

Status: early demo. Accounts and posts are stored on the device only; a real backend (Supabase) comes next. See `CLAUDE.md` for the product decisions and `docs/research/` for the research behind them.

## Try it on your phone

You need a computer with [Node.js](https://nodejs.org) (the LTS version) and the free **Expo Go** app on your phone.

```bash
git clone https://github.com/zachrotkowitz/niches.git
cd niches
npm install
npx expo start
```

A QR code appears in the terminal. On iPhone, scan it with the Camera app; on Android, scan it from inside Expo Go. Your phone and computer must be on the same Wi-Fi.

To try it in a web browser instead, press `w` after `npx expo start`.

## What's in the demo

- 18+ sign-up (US only), stored on the device
- Cooking feed, newest first, with a real end ("You're caught up in Cooking") and older posts behind a tap
- Posts and Grid layouts; tapping a grid tile opens the post with a back button
- Each niche has its own color; Art, Photography and Gym are "coming soon" with a notify button
- Cheer, save and comment; only the poster sees their numbers
- Create a post, progress update or question
- Saved, Profile (niche tabs), Discover (niche list and "Request a niche")

Photos are colored placeholders until uploads are built.

## For developers

```bash
npm run typecheck      # TypeScript
npx expo export -p web # production web build into dist/
```

Code lives in `src/`: routes in `src/app/` (Expo Router), shared UI in `src/components/`, and data, theme and demo content in `src/lib/`.
