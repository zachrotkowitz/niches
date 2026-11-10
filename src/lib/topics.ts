import type { NicheId } from './theme';

export type Topic = { id: string; label: string; words: string[] };

/**
 * Topics for each niche's Discover page (All · Pasta · Bread …).
 * In the demo a post's topics are guessed from the words in its caption and
 * title. Later, posters can pick a topic when they post.
 */
export const TOPICS: Record<NicheId, Topic[]> = {
  cooking: [
    { id: 'pasta', label: 'Pasta', words: ['pasta', 'tagliatelle', 'ravioli', 'gnocchi', 'carbonara', 'spaghetti', 'noodle', 'lasagna'] },
    { id: 'bread', label: 'Bread', words: ['bread', 'sourdough', 'focaccia', 'loaf', 'loaves'] },
    { id: 'weeknight', label: 'Weeknight', words: ['weeknight', 'minute', 'quick', 'ten minutes', 'four ingredients'] },
    { id: 'sauces', label: 'Sauces', words: ['sauce', 'chili crisp', 'herb oil', 'butter', 'pesto', 'dressing'] },
    { id: 'baking', label: 'Baking', words: ['bake', 'baking', 'cake', 'cookie', 'pie', 'tart', 'pastry'] },
  ],
  art: [
    { id: 'watercolor', label: 'Watercolor', words: ['watercolor', 'watercolour'] },
    { id: 'gouache', label: 'Gouache', words: ['gouache'] },
    { id: 'ink', label: 'Ink', words: ['ink', 'pen'] },
    { id: 'sketchbook', label: 'Sketchbook', words: ['sketch', 'sketchbook'] },
    { id: 'process', label: 'Process', words: ['process', 'start to finish', 'painting #'] },
  ],
  photography: [
    { id: 'film', label: 'Film', words: ['film', '35mm', 'roll', 'portra'] },
    { id: 'golden', label: 'Golden hour', words: ['golden hour', 'sunset', 'sunrise'] },
    { id: 'street', label: 'Street', words: ['street', 'market', 'city'] },
    { id: 'night', label: 'Night', words: ['night', 'rain'] },
    { id: 'landscape', label: 'Landscape', words: ['fog', 'bridge', 'mountain', 'harbor', 'sea'] },
  ],
  gym: [],
};

export function postText(p: { caption: string; mediaLabel?: string; previewTitle?: string }): string {
  return `${p.mediaLabel ?? ''} ${p.previewTitle ?? ''} ${p.caption}`.toLowerCase();
}

export function matchesTopic(p: { caption: string; mediaLabel?: string; previewTitle?: string }, topic: Topic): boolean {
  const text = postText(p);
  return topic.words.some((w) => text.includes(w));
}
