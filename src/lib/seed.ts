// Demo content so feeds aren't empty before real users join.
// Everything here is fictional.

import type { Comment, Post, User } from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Bump when seed content changes, so existing installs pick up new demo posts. */
export const SEED_VERSION = 2;

export const SEED_USERS: User[] = [
  { id: 'u_maya', displayName: 'Maya Okafor', username: 'maya.cooks', avatarColor: '#7A4E9E', bio: 'Learning fresh pasta one bad batch at a time. Also paint on Sundays.' },
  { id: 'u_dev', displayName: 'Dev Patel', username: 'dev_bakes', avatarColor: '#2F6F8F', bio: 'Sourdough, mostly.' },
  { id: 'u_jules', displayName: 'Jules Moreau', username: 'kitchen.jules', avatarColor: '#B4532A', bio: 'Fast sauces, big flavor.' },
  { id: 'u_sam', displayName: 'Sam Rivera', username: 'sam.r', avatarColor: '#3D7A55', bio: 'Home cook, spice collector.' },
  { id: 'u_priya', displayName: 'Priya Shah', username: 'priya.eats', avatarColor: '#8E2F4F', bio: 'Weeknight-fancy food and the occasional film photo.' },
  { id: 'u_ana', displayName: 'Ana Lima', username: 'ana.kitchen', avatarColor: '#9A5200', bio: 'Four ingredients or fewer.' },
  { id: 'u_theo', displayName: 'Theo Green', username: 'theo.green', avatarColor: '#5B6B2E', bio: 'Herbs, oils and a small balcony garden.' },
  { id: 'u_lu', displayName: 'Lu Chen', username: 'lu.cooks', avatarColor: '#6B5B95', bio: 'Cooking for friends is the whole point.' },
  // Founding creators previewing niches that aren't open yet.
  { id: 'u_rosa', displayName: 'Rosa Vega', username: 'rosa.paints', avatarColor: '#3B3FCB', bio: 'Watercolor and gouache. Founding creator, Art.', foundingCreator: true },
  { id: 'u_kenji', displayName: 'Kenji Mori', username: 'kenji.ink', avatarColor: '#23267A', bio: 'Ink sketches of everyday streets. Founding creator, Art.', foundingCreator: true },
  { id: 'u_nadia', displayName: 'Nadia Brooks', username: 'nadia.frames', avatarColor: '#9A5200', bio: '35mm and golden hour. Founding creator, Photography.', foundingCreator: true },
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

    // Art (preview from founding creators)
    { id: 'p_art_harbor', authorId: 'u_rosa', niche: 'art', kind: 'photo', createdAt: now - 2 * HOUR, mediaColor: '#5A6FD0', mediaLabel: 'Harbor at dusk, watercolor', caption: 'Harbor at dusk. Let the sky bleed into the water and stopped before I fixed it.', seedCheers: 52, seedSaves: 38 },
    { id: 'p_art_street', authorId: 'u_kenji', niche: 'art', kind: 'photo', createdAt: now - 9 * HOUR, mediaColor: '#2D3142', mediaLabel: 'Ink sketch of a corner store', caption: 'Corner store on 5th, ten-minute ink sketch. No pencil first.', seedCheers: 31, seedSaves: 21 },
    { id: 'p_art_q', authorId: 'u_rosa', niche: 'art', kind: 'text', createdAt: now - 26 * HOUR, caption: 'Watercolor people: cold press or hot press for loose florals? I keep going back and forth.', seedCheers: 14 },
    { id: 'p_art_lemons', authorId: 'u_maya', niche: 'art', kind: 'photo', createdAt: now - 3 * DAY, mediaColor: '#E5C14A', mediaLabel: 'Gouache lemons', progressLabel: '10 small paintings, #7', caption: 'Painting #7 of 10: gouache lemons. The shadows finally look purple, not gray.', seedCheers: 22, seedSaves: 9 },
    { id: 'p_art_figure', authorId: 'u_kenji', niche: 'art', kind: 'photo', createdAt: now - 4 * DAY, mediaColor: '#8C5E58', mediaLabel: 'Two-minute figure studies', caption: 'Two-minute figure studies from Thursday’s drop-in class.', seedCheers: 18, seedSaves: 25 },

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
    { id: 'c11', postId: 'p_art_harbor', authorId: 'u_maya', text: 'Stopping early is the hardest part. This is beautiful.', createdAt: now - 1 * HOUR },
  ];
}

/** Posts newer than this are "new". Older ones sit behind "Show older posts". */
export const FRESH_WINDOW_MS = 24 * HOUR;

/** Discover's "inspiration this week" window. */
export const WEEK_MS = 7 * DAY;
