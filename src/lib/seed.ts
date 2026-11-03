// Demo content so the Cooking feed isn't empty before real users join.
// Everything here is fictional and labeled as a demo in the app.

import type { Comment, Post, User } from './types';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const SEED_USERS: User[] = [
  { id: 'u_maya', displayName: 'Maya Okafor', username: 'maya.cooks', avatarColor: '#7A4E9E', bio: 'Learning fresh pasta one bad batch at a time.' },
  { id: 'u_dev', displayName: 'Dev Patel', username: 'dev_bakes', avatarColor: '#2F6F8F', bio: 'Sourdough, mostly.' },
  { id: 'u_jules', displayName: 'Jules Moreau', username: 'kitchen.jules', avatarColor: '#B4532A', bio: 'Fast sauces, big flavor.' },
  { id: 'u_sam', displayName: 'Sam Rivera', username: 'sam.r', avatarColor: '#3D7A55' },
  { id: 'u_priya', displayName: 'Priya Shah', username: 'priya.eats', avatarColor: '#8E2F4F' },
  { id: 'u_ana', displayName: 'Ana Lima', username: 'ana.kitchen', avatarColor: '#9A5200' },
  { id: 'u_theo', displayName: 'Theo Green', username: 'theo.green', avatarColor: '#5B6B2E' },
  { id: 'u_lu', displayName: 'Lu Chen', username: 'lu.cooks', avatarColor: '#6B5B95' },
];

export function seedPosts(now: number): Post[] {
  return [
    { id: 'p_tagliatelle', authorId: 'u_maya', niche: 'cooking', kind: 'photo', createdAt: now - 12 * MIN, mediaColor: '#C8553D', mediaLabel: 'Hand-cut tagliatelle', progressLabel: 'Fresh pasta, week 3', caption: 'Third try at hand-cut tagliatelle. Still too thick, still delicious. Next week: a thinner roll.', seedCheers: 23, seedSaves: 12 },
    { id: 'p_sourdough', authorId: 'u_dev', niche: 'cooking', kind: 'photo', createdAt: now - 1 * HOUR, mediaColor: '#C9A877', mediaLabel: 'Sourdough loaf', caption: 'Loaf #14 finally got an ear. 78% hydration, cold proof overnight.', seedCheers: 41, seedSaves: 19 },
    { id: 'p_chili', authorId: 'u_jules', niche: 'cooking', kind: 'video', createdAt: now - 3 * HOUR, mediaColor: '#5E2A22', mediaLabel: 'Chili crisp in 60 seconds', durationSec: 58, caption: 'Chili crisp in under a minute. Recipe in the comments.', seedCheers: 88, seedSaves: 64 },
    { id: 'p_paprika', authorId: 'u_sam', niche: 'cooking', kind: 'text', createdAt: now - 5 * HOUR, caption: 'What’s one spice you’d never give up? Mine is smoked paprika.', seedCheers: 9 },
    { id: 'p_corn', authorId: 'u_ana', niche: 'cooking', kind: 'photo', createdAt: now - 7 * HOUR, mediaColor: '#E0A43A', mediaLabel: 'Miso butter corn', caption: 'Miso butter corn. Four ingredients, ten minutes.', seedCheers: 17, seedSaves: 8 },
    { id: 'p_herboil', authorId: 'u_theo', niche: 'cooking', kind: 'photo', createdAt: now - 10 * HOUR, mediaColor: '#6E8B4E', mediaLabel: 'Herb oil in three jars', caption: 'Herb oil three ways: basil, chive, dill. Blanch first so it stays bright.', seedCheers: 12, seedSaves: 15 },
    { id: 'p_beets', authorId: 'u_priya', niche: 'cooking', kind: 'photo', createdAt: now - 14 * HOUR, mediaColor: '#8E2F4F', mediaLabel: 'Beet and labneh plate', caption: 'Roasted beets on labneh with pistachio. Weeknight-fancy.', seedCheers: 30, seedSaves: 22 },
    { id: 'p_risotto', authorId: 'u_lu', niche: 'cooking', kind: 'photo', createdAt: now - 20 * HOUR, mediaColor: '#2B2B2E', mediaLabel: 'Squid ink risotto', caption: 'Squid ink risotto for a friend’s birthday. Teeth were black, nobody cared.', seedCheers: 26, seedSaves: 11 },
    // Older than a day: shown only after "Show older posts".
    { id: 'p_gnocchi', authorId: 'u_priya', niche: 'cooking', kind: 'photo', createdAt: now - 30 * HOUR, mediaColor: '#B9783F', mediaLabel: 'Brown butter gnocchi', caption: 'Brown butter gnocchi, a 20-minute weeknight win.', seedCheers: 34, seedSaves: 27 },
    { id: 'p_ravioli', authorId: 'u_maya', niche: 'cooking', kind: 'photo', createdAt: now - 6 * 24 * HOUR, mediaColor: '#E0A43A', mediaLabel: 'Ricotta and lemon ravioli', progressLabel: 'Fresh pasta, week 2', caption: 'Ricotta and lemon ravioli. Two burst. The rest were perfect.', seedCheers: 19, seedSaves: 6 },
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
  ];
}

/** Posts newer than this are "new". Older ones sit behind "Show older posts". */
export const FRESH_WINDOW_MS = 24 * HOUR;
