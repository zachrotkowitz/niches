// Demo content so feeds aren't empty before real users join.
// Everything here is fictional.

import type { Comment, Post, User } from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Bump when seed content changes, so existing installs pick up new demo posts. */
export const SEED_VERSION = 4;

export const SEED_USERS: User[] = [
  { id: 'u_maya', displayName: 'Maya Okafor', username: 'maya.cooks', avatarColor: '#7A4E9E', bio: 'Learning fresh pasta one bad batch at a time. Also paint on Sundays.' },
  { id: 'u_dev', displayName: 'Dev Sethi', username: 'dev_bakes', avatarColor: '#2F6F8F', bio: 'Sourdough, mostly.' },
  { id: 'u_jules', displayName: 'Jules Moreau', username: 'kitchen.jules', avatarColor: '#B4532A', bio: 'Fast sauces, big flavor.' },
  { id: 'u_sam', displayName: 'Sam Rivera', username: 'sam.r', avatarColor: '#3D7A55', bio: 'Home cook, spice collector.' },
  { id: 'u_priya', displayName: 'Priya Shah', username: 'priya.eats', avatarColor: '#8E2F4F', bio: 'Weeknight-fancy food and the occasional film photo.' },
  { id: 'u_ana', displayName: 'Ana Lima', username: 'ana.kitchen', avatarColor: '#9A5200', bio: 'Four ingredients or fewer.' },
  { id: 'u_theo', displayName: 'Theo Green', username: 'theo.green', avatarColor: '#5B6B2E', bio: 'Herbs, oils and a small balcony garden.' },
  { id: 'u_lu', displayName: 'Lu Chen', username: 'lu.cooks', avatarColor: '#6B5B95', bio: 'Cooking for friends is the whole point.' },
  // Founding creators previewing niches that aren't open yet.
  { id: 'u_rosa', displayName: 'Rosa Vega', username: 'rosa.paints', avatarColor: '#3B3FCB', bio: 'Watercolor and gouache. Founding creator, Art.', foundingCreator: true, membership: { priceCents: 499, tagline: 'Watch every painting come together', perks: ['Full-length process videos', 'My palette and paper for each piece', 'Monthly paint-along'] } },
  { id: 'u_kenji', displayName: 'Kenji Mori', username: 'kenji.ink', avatarColor: '#23267A', bio: 'Ink sketches of everyday streets. Founding creator, Art.', foundingCreator: true },
  { id: 'u_nadia', displayName: 'Nadia Brooks', username: 'nadia.frames', avatarColor: '#9A5200', bio: '35mm and golden hour. Founding creator, Photography.', foundingCreator: true, membership: { priceCents: 399, tagline: 'Shoot and edit along with me', perks: ['Raw files from my best frames', 'Edit breakdowns, start to finish', 'First look at new print drops'] } },
  // Invite-only creators (demo). Fictional people, not real celebrities.
  { id: 'u_ines', displayName: 'Inès Duarte', username: 'chef.ines', avatarColor: '#7A2E2E', bio: 'Chef and owner of a tiny 20-seat bistro. I teach the techniques restaurants don’t write down.', verified: true, membership: { priceCents: 599, tagline: 'Cook like you work the line', perks: ['A members-only recipe video every week', 'Full recipe cards with weights and timings', 'Monthly live cook-along'] } },
  { id: 'u_dax', displayName: 'Dax Romero', username: 'daxcooks', avatarColor: '#1F3A5F', bio: 'Actor, very serious home cook. Yes, I make everything myself.', verified: true, membership: { priceCents: 399, tagline: 'What I actually cook at home', perks: ['The recipes from my set trailer', 'Sunday batch-cook videos', 'Ask-me-anything every month'] } },
  { id: 'u_omar', displayName: 'Omar Haddad', username: 'omar.shoots', avatarColor: '#5C3100', bio: 'Street and night photography. Founding creator, Photography.', foundingCreator: true },
];

/** Who follows whom among the demo accounts: [follower, followed]. */
export const SEED_FOLLOWS: [string, string][] = [
  ['u_maya', 'u_dev'], ['u_maya', 'u_jules'], ['u_maya', 'u_lu'], ['u_maya', 'u_rosa'], ['u_maya', 'u_priya'],
  ['u_dev', 'u_maya'], ['u_dev', 'u_jules'], ['u_dev', 'u_ana'],
  ['u_jules', 'u_maya'], ['u_jules', 'u_dev'], ['u_jules', 'u_ana'], ['u_jules', 'u_priya'],
  ['u_sam', 'u_maya'], ['u_sam', 'u_jules'], ['u_sam', 'u_theo'],
  ['u_priya', 'u_maya'], ['u_priya', 'u_nadia'], ['u_priya', 'u_omar'], ['u_priya', 'u_lu'],
  ['u_ana', 'u_jules'], ['u_ana', 'u_dev'],
  ['u_theo', 'u_sam'], ['u_theo', 'u_ana'],
  ['u_lu', 'u_maya'], ['u_lu', 'u_priya'], ['u_lu', 'u_jules'],
  ['u_rosa', 'u_kenji'], ['u_rosa', 'u_maya'], ['u_rosa', 'u_nadia'],
  ['u_kenji', 'u_rosa'], ['u_kenji', 'u_omar'],
  ['u_nadia', 'u_omar'], ['u_nadia', 'u_rosa'], ['u_nadia', 'u_priya'],
  ['u_omar', 'u_nadia'], ['u_omar', 'u_kenji'],
  ['u_maya', 'u_ines'], ['u_dev', 'u_ines'], ['u_jules', 'u_ines'], ['u_lu', 'u_ines'], ['u_priya', 'u_ines'], ['u_ana', 'u_ines'],
  ['u_sam', 'u_dax'], ['u_theo', 'u_dax'], ['u_lu', 'u_dax'], ['u_ana', 'u_dax'], ['u_maya', 'u_dax'],
  ['u_ines', 'u_jules'], ['u_dax', 'u_ines'],
];

export function seedPosts(now: number): Post[] {
  return [
    // Cooking
    { id: 'p_tagliatelle', authorId: 'u_maya', niche: 'cooking', kind: 'photo', createdAt: now - 12 * MIN, mediaColor: '#C8553D', mediaLabel: 'Hand-cut tagliatelle', progressLabel: 'Fresh pasta, week 3', caption: 'Third try at hand-cut tagliatelle. Still too thick, still delicious. Next week: a thinner roll.', seedCheers: 23, seedSaves: 12 },
    { id: 'p_sourdough', authorId: 'u_dev', niche: 'cooking', kind: 'photo', createdAt: now - 1 * HOUR, mediaColor: '#C9A877', mediaLabel: 'Sourdough loaf', caption: 'Loaf #14 finally got an ear. 78% hydration, cold proof overnight.', seedCheers: 41, seedSaves: 19 },
    { id: 'p_chili', authorId: 'u_jules', niche: 'cooking', kind: 'video', createdAt: now - 3 * HOUR, mediaColor: '#5E2A22', mediaLabel: 'Chili crisp in 60 seconds', durationSec: 58, caption: 'Chili crisp in under a minute. Recipe in the comments.', seedCheers: 88, seedSaves: 64 },
    { id: 'p_paprika', authorId: 'u_sam', niche: 'cooking', kind: 'text', createdAt: now - 5 * HOUR, caption: 'What’s one spice you’d never give up? Mine is smoked paprika.', seedCheers: 9 },
    { id: 'p_corn', authorId: 'u_ana', niche: 'cooking', kind: 'photo', createdAt: now - 7 * HOUR, mediaColor: '#E0A43A', mediaLabel: 'Miso butter corn', caption: 'Miso butter corn. Four ingredients, ten minutes.', seedCheers: 17, seedSaves: 8 },
    { id: 'p_herboil', authorId: 'u_theo', niche: 'cooking', kind: 'photo', createdAt: now - 10 * HOUR, mediaColor: '#6E8B4E', mediaLabel: 'Herb oil in three jars', caption: 'Herb oil three ways: basil, chive, dill. Blanch first so it stays bright.', seedCheers: 12, seedSaves: 15 },
    { id: 'p_beets', authorId: 'u_priya', niche: 'cooking', kind: 'photo', createdAt: now - 14 * HOUR, mediaColor: '#8E2F4F', mediaLabel: 'Beet and labneh plate', caption: 'Roasted beets on labneh with pistachio. Weeknight-fancy.', seedCheers: 30, seedSaves: 22 },
    { id: 'p_risotto', authorId: 'u_lu', niche: 'cooking', kind: 'photo', createdAt: now - 20 * HOUR, mediaColor: '#2B2B2E', mediaLabel: 'Squid ink risotto', caption: 'Squid ink risotto for a friend’s birthday. Teeth were black, nobody cared.', seedCheers: 26, seedSaves: 11 },
    { id: 'p_gnocchi', authorId: 'u_priya', niche: 'cooking', kind: 'photo', createdAt: now - 30 * HOUR, mediaColor: '#B9783F', mediaLabel: 'Brown butter gnocchi', caption: 'Brown butter gnocchi, a 20-minute weeknight win.', seedCheers: 34, seedSaves: 27 },
    { id: 'p_ravioli', authorId: 'u_maya', niche: 'cooking', kind: 'photo', createdAt: now - 6 * DAY, mediaColor: '#E0A43A', mediaLabel: 'Ricotta and lemon ravioli', progressLabel: 'Fresh pasta, week 2', caption: 'Ricotta and lemon ravioli. Two burst. The rest were perfect.', seedCheers: 19, seedSaves: 6 },

    // Verified and premium creators
    { id: 'p_ines_sauce', authorId: 'u_ines', niche: 'cooking', kind: 'photo', createdAt: now - 2 * HOUR, mediaColor: '#A33B2B', mediaLabel: 'Pan sauce, mounted with butter', caption: 'The one thing that makes home cooking taste like a restaurant: a pan sauce. Deglaze, reduce, cold butter off the heat. Every time.', seedCheers: 210, seedSaves: 180 },
    { id: 'p_ines_shortrib', authorId: 'u_ines', niche: 'cooking', kind: 'video', createdAt: now - 6 * HOUR, mediaColor: '#4A1F1A', mediaLabel: 'Three-day short rib, full walkthrough', durationSec: 88, caption: 'Members: my three-day short rib, start to finish. Brine, braise, press, glaze. Full recipe card in the comments.', premium: true, unlockCents: 299, seedCheers: 96, seedSaves: 120 },
    { id: 'p_dax_eggs', authorId: 'u_dax', niche: 'cooking', kind: 'photo', createdAt: now - 4 * HOUR, mediaColor: '#E7C66A', mediaLabel: 'Soft scrambled eggs on toast', caption: 'Call time was 5am, so: soft scrambled eggs, chives, too much butter. No regrets.', seedCheers: 340, seedSaves: 95 },
    { id: 'p_dax_trailer', authorId: 'u_dax', niche: 'cooking', kind: 'photo', createdAt: now - 18 * HOUR, mediaColor: '#3E5C3A', mediaLabel: 'Meal prep in a trailer kitchenette', caption: 'Members: what I actually eat on set, all five lunches for the week, and how I cook them on one burner.', premium: true, unlockCents: 199, seedCheers: 150, seedSaves: 88 },
    { id: 'p_art_process', authorId: 'u_rosa', niche: 'art', kind: 'video', createdAt: now - 20 * HOUR, mediaColor: '#4B5CC4', mediaLabel: 'Harbor at dusk, full painting process', durationSec: 90, caption: 'Members: the full process for Harbor at Dusk, from first wash to the last lift. Palette list included.', premium: true, unlockCents: 249, seedCheers: 40, seedSaves: 52 },
    { id: 'p_photo_raw', authorId: 'u_nadia', niche: 'photography', kind: 'photo', createdAt: now - 30 * HOUR, mediaColor: '#B86E2E', mediaLabel: 'Before and after: golden hour edit', caption: 'Members: raw file and my full edit for the golden hour frame. Every slider, explained.', premium: true, seedCheers: 33, seedSaves: 41 },

    // Art (preview from founding creators)
    { id: 'p_art_harbor', authorId: 'u_rosa', niche: 'art', kind: 'photo', createdAt: now - 2 * HOUR, mediaColor: '#5A6FD0', mediaLabel: 'Harbor at dusk, watercolor', caption: 'Harbor at dusk. Let the sky bleed into the water and stopped before I fixed it.', seedCheers: 52, seedSaves: 38 },
    { id: 'p_art_street', authorId: 'u_kenji', niche: 'art', kind: 'photo', createdAt: now - 9 * HOUR, mediaColor: '#2D3142', mediaLabel: 'Ink sketch of a corner store', caption: 'Corner store on 5th, ten-minute ink sketch. No pencil first.', seedCheers: 31, seedSaves: 21 },
    { id: 'p_art_q', authorId: 'u_rosa', niche: 'art', kind: 'text', createdAt: now - 26 * HOUR, caption: 'Watercolor people: cold press or hot press for loose florals? I keep going back and forth.', seedCheers: 14 },
    { id: 'p_art_lemons', authorId: 'u_maya', niche: 'art', kind: 'photo', createdAt: now - 3 * DAY, mediaColor: '#E5C14A', mediaLabel: 'Gouache lemons', progressLabel: '10 small paintings, #7', caption: 'Painting #7 of 10: gouache lemons. The shadows finally look purple, not gray.', seedCheers: 22, seedSaves: 9 },
    { id: 'p_art_figure', authorId: 'u_kenji', niche: 'art', kind: 'photo', createdAt: now - 4 * DAY, mediaColor: '#8C5E58', mediaLabel: 'Watercolor pet portrait', caption: 'Quick watercolor portrait of my neighbor’s chihuahua. Forty minutes, one sitting, zero cooperation.', seedCheers: 18, seedSaves: 25 },

    // Photography (preview from founding creators)
    { id: 'p_photo_golden', authorId: 'u_nadia', niche: 'photography', kind: 'photo', createdAt: now - 4 * HOUR, mediaColor: '#D98A3D', mediaLabel: 'Golden hour on a 35mm roll', caption: 'Last frame on the roll, golden hour, Portra 400. Worth the wait for the lab.', seedCheers: 47, seedSaves: 44 },
    { id: 'p_photo_night', authorId: 'u_omar', niche: 'photography', kind: 'photo', createdAt: now - 12 * HOUR, mediaColor: '#1F2A44', mediaLabel: 'Rainy street at night', caption: 'Rain makes every street light a reflector. 1/30s handheld.', seedCheers: 39, seedSaves: 33 },
    { id: 'p_photo_market', authorId: 'u_priya', niche: 'photography', kind: 'photo', createdAt: now - 2 * DAY, mediaColor: '#A3483A', mediaLabel: 'Saturday farmers market', caption: 'Saturday market. Asked before every portrait, everyone said yes.', seedCheers: 20, seedSaves: 12 },
    { id: 'p_photo_q', authorId: 'u_omar', niche: 'photography', kind: 'text', createdAt: now - 3 * DAY, caption: 'Best first prime lens on a budget? 35mm or 50mm, and why?', seedCheers: 11 },
    { id: 'p_photo_fog', authorId: 'u_nadia', niche: 'photography', kind: 'photo', createdAt: now - 5 * DAY, mediaColor: '#9AA5A8', mediaLabel: 'Fog over the bridge', caption: 'Fog over the bridge at 6am. Alarm was worth it.', seedCheers: 29, seedSaves: 30 },
  ];
}

export function seedComments(now: number): Comment[] {
  return [
    { id: 'c1', postId: 'p_tagliatelle', authorId: 'u_dev', text: 'Try a pasta roller on setting 6 before cutting. Game changer.', createdAt: now - 8 * MIN },
    { id: 'c2', postId: 'p_tagliatelle', authorId: 'u_lu', text: 'Thick tagliatelle with a ragù is honestly better.', createdAt: now - 6 * MIN },
    { id: 'c3', postId: 'p_tagliatelle', authorId: 'u_sam', text: 'Week 3 already. Love watching this goal.', createdAt: now - 2 * MIN },
    { id: 'c4', postId: 'p_chili', authorId: 'u_jules', text: 'Recipe: 1 cup neutral oil, 3 tbsp chili flakes, 6 cloves garlic, 2 shallots, 1 tsp sugar, salt. Fry aromatics low until golden, pour over flakes.', createdAt: now - 3 * HOUR + 2 * MIN },
    { id: 'c5', postId: 'p_chili', authorId: 'u_ana', text: 'Made this tonight. Dangerous.', createdAt: now - 1 * HOUR },
    { id: 'c6', postId: 'p_paprika', authorId: 'u_theo', text: 'Sumac. Puts lemon on everything without the liquid.', createdAt: now - 4 * HOUR },
    { id: 'c7', postId: 'p_paprika', authorId: 'u_priya', text: 'Cumin, no contest.', createdAt: now - 3 * HOUR },
    { id: 'c8', postId: 'p_sourdough', authorId: 'u_maya', text: 'That ear! What flour?', createdAt: now - 40 * MIN },
    { id: 'c9', postId: 'p_art_q', authorId: 'u_kenji', text: 'Cold press. Hot press is gorgeous but unforgiving with loose washes.', createdAt: now - 20 * HOUR },
    { id: 'c10', postId: 'p_photo_q', authorId: 'u_nadia', text: '35mm. You can always crop, you can’t step back in a small room.', createdAt: now - 2 * DAY },
    { id: 'c12', postId: 'p_ines_shortrib', authorId: 'u_ines', text: 'Recipe card: 2 kg bone-in short rib. Day 1: dry brine, 1.5% salt by weight. Day 2: sear hard, braise at 150°C for 4 hours in stock, wine and aromatics; chill pressed under a tray. Day 3: portion, reduce the braising liquid to a glaze, warm through and baste.', createdAt: now - 5 * HOUR },
    { id: 'c13', postId: 'p_ines_shortrib', authorId: 'u_jules', text: 'The pressing step is the secret. Never going back.', createdAt: now - 3 * HOUR },
    { id: 'c14', postId: 'p_dax_trailer', authorId: 'u_dax', text: 'Monday: chicken thighs and rice. Tuesday: lentil soup. Wednesday: the leftover thighs in tacos. Thursday: eggs, always eggs. Friday: whatever craft services forgot.', createdAt: now - 17 * HOUR },
    { id: 'c11', postId: 'p_art_harbor', authorId: 'u_maya', text: 'Stopping early is the hardest part. This is beautiful.', createdAt: now - 1 * HOUR },
  ];
}

/** Posts newer than this are "new". Older ones sit behind "Show older posts". */
export const FRESH_WINDOW_MS = 24 * HOUR;

/** Discover's "inspiration this week" window. */
export const WEEK_MS = 7 * DAY;
