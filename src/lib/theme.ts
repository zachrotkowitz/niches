// Visual system for Niches. Every niche owns a color; the app re-tints to the
// niche you are in. Keep the defaults in sync with the approved mockups.

export type NicheId = 'cooking' | 'art' | 'photography' | 'gym';

/** A niche's color set. Every palette passes WCAG AA: accent and ink on white, ink on field. */
export type Palette = {
  id: string;
  name: string;
  /** Buttons, selected states, icons, borders. */
  accent: string;
  /** The niche's tinted ground: headers, panels, tags. */
  field: string;
  /** Text on the field color. */
  ink: string;
  /** Secondary text on the field color. */
  inkSoft: string;
};

export type Niche = Omit<Palette, 'id' | 'name'> & {
  id: NicheId;
  label: string;
  paletteId: string;
  /** Open for posting, or still "coming soon". */
  open: boolean;
};

// Curated palettes for the Color lab. Any niche can take any palette.
export const PALETTES: Palette[] = [
  { id: 'basil', name: 'Basil', accent: '#1E6B47', field: '#E4F0E8', ink: '#123F2A', inkSoft: '#2E5A43' },
  { id: 'olive', name: 'Olive', accent: '#566416', field: '#EEF1DD', ink: '#343E0F', inkSoft: '#48521E' },
  { id: 'teal', name: 'Teal', accent: '#0F6B6B', field: '#DDF1F0', ink: '#0A4343', inkSoft: '#22595A' },
  { id: 'cobalt', name: 'Cobalt', accent: '#1F5FB8', field: '#E2ECFA', ink: '#123A70', inkSoft: '#2D4E80' },
  { id: 'ultramarine', name: 'Ultramarine', accent: '#3B3FCB', field: '#E8E9FB', ink: '#23267A', inkSoft: '#3A3E8F' },
  { id: 'eggplant', name: 'Eggplant', accent: '#6A2E7A', field: '#F1E6F4', ink: '#3F1849', inkSoft: '#57305F' },
  { id: 'raspberry', name: 'Raspberry', accent: '#B0255A', field: '#FBE7EE', ink: '#6B1236', inkSoft: '#7E2A4B' },
  { id: 'tomato', name: 'Tomato', accent: '#B3361F', field: '#FBE6E1', ink: '#6B1D10', inkSoft: '#7E3424' },
  { id: 'amber', name: 'Amber', accent: '#9A5200', field: '#FBEEDB', ink: '#5C3100', inkSoft: '#6E4310' },
  { id: 'saffron', name: 'Saffron', accent: '#8A5A00', field: '#FBF0D4', ink: '#523500', inkSoft: '#664912' },
  { id: 'slate', name: 'Slate', accent: '#3F4A5A', field: '#E9ECF0', ink: '#232A33', inkSoft: '#3A4350' },
];

export const PALETTES_BY_ID: Record<string, Palette> = Object.fromEntries(PALETTES.map((p) => [p.id, p]));

type NicheBase = { id: NicheId; label: string; paletteId: string; open: boolean };

const NICHE_BASE: Record<NicheId, NicheBase> = {
  cooking: { id: 'cooking', label: 'Cooking', paletteId: 'basil', open: true },
  art: { id: 'art', label: 'Art', paletteId: 'ultramarine', open: false },
  photography: { id: 'photography', label: 'Photography', paletteId: 'amber', open: false },
  gym: { id: 'gym', label: 'Gym', paletteId: 'raspberry', open: false },
};

export const NICHE_ORDER: NicheId[] = ['cooking', 'art', 'photography', 'gym'];

/** Builds the niche list, applying any palettes chosen in the Color lab. */
export function resolveNiches(overrides: Partial<Record<NicheId, string>> = {}): Record<NicheId, Niche> {
  const out = {} as Record<NicheId, Niche>;
  for (const id of NICHE_ORDER) {
    const base = NICHE_BASE[id];
    const paletteId = overrides[id] && PALETTES_BY_ID[overrides[id]!] ? overrides[id]! : base.paletteId;
    const { id: _pid, name: _name, ...colors } = PALETTES_BY_ID[paletteId];
    out[id] = { ...base, ...colors, paletteId };
  }
  return out;
}

/** The approved default colors. Screens should prefer `useNiches()` so Color lab changes apply. */
export const NICHES = resolveNiches();

export const DEFAULT_PALETTE: Record<NicheId, string> = {
  cooking: NICHE_BASE.cooking.paletteId,
  art: NICHE_BASE.art.paletteId,
  photography: NICHE_BASE.photography.paletteId,
  gym: NICHE_BASE.gym.paletteId,
};

export const colors = {
  ground: '#FFFFFF',
  surface: '#F4F5F2',
  text: '#14161A',
  textBody: '#2B3036',
  textSecondary: '#3E444B',
  textMuted: '#5B6168',
  hairline: '#ECEEEA',
  border: 'rgba(20,22,26,0.14)',
  inputBorder: '#DADDD8',
  note: '#FFF6D9',
  danger: '#B42318',
};

export const fonts = {
  display: 'SchibstedGrotesk_700Bold',
  displayHeavy: 'SchibstedGrotesk_800ExtraBold',
};

/** Minimum tappable size (Apple HIG 44pt). */
export const TOUCH = 44;

/**
 * Ready-made color schemes for the Color lab, each built on a color-theory
 * idea. Palette ids refer to PALETTES above.
 */
export type Scheme = { id: string; name: string; theory: string; why: string; palettes: Record<NicheId, string> };

export const SCHEMES: Scheme[] = [
  {
    id: 'original',
    name: 'Original',
    theory: 'Rectangle: two pairs of opposites',
    why: 'Green sits opposite raspberry and blue-violet opposite amber on the color wheel, so all four niches feel balanced and are easy to tell apart.',
    palettes: { cooking: 'basil', art: 'ultramarine', photography: 'amber', gym: 'raspberry' },
  },
  {
    id: 'meaning',
    name: 'By subject',
    theory: 'Colors chosen for what each niche is about',
    why: 'Tomato red is warm and appetizing, ultramarine is the classic painter’s blue, slate is the neutral gray of a darkroom, and basil green says health and growth without the aggression of red.',
    palettes: { cooking: 'tomato', art: 'ultramarine', photography: 'slate', gym: 'basil' },
  },
  {
    id: 'primaries',
    name: 'Bold primaries',
    theory: 'Triad: three colors evenly spaced',
    why: 'Red, yellow and blue sit a third of the wheel apart, which reads as confident and playful. Green joins as the fourth so Gym has its own lane.',
    palettes: { cooking: 'tomato', art: 'cobalt', photography: 'saffron', gym: 'basil' },
  },
  {
    id: 'calm',
    name: 'Calm cools',
    theory: 'Analogous: neighbors on the wheel',
    why: 'Olive, teal, blue and purple run side by side around the cool half of the wheel, so the app feels calm and cohesive. The trade-off: niches are a little harder to tell apart at a glance.',
    palettes: { cooking: 'olive', art: 'eggplant', photography: 'teal', gym: 'cobalt' },
  },
  {
    id: 'cozy',
    name: 'Cozy warms',
    theory: 'Analogous: warm neighbors',
    why: 'Olive, saffron, tomato and raspberry run from yellow-green to pink, like a farmers market. Warm and inviting, but the niches blend together more than other schemes.',
    palettes: { cooking: 'olive', art: 'raspberry', photography: 'saffron', gym: 'tomato' },
  },
];

function hexToLab(hex: string): [number, number, number] {
  const lin = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = lin;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** How different two colors look to the eye (CIE76 ΔE; above ~25 reads as clearly different). */
export function colorDistance(a: string, b: string): number {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Rates how easily niches can be told apart when they sit side by side. */
export function distinctness(accents: string[]): { label: string; score: number } {
  let min = Infinity;
  for (let i = 0; i < accents.length; i++) for (let j = i + 1; j < accents.length; j++) min = Math.min(min, colorDistance(accents[i], accents[j]));
  if (!Number.isFinite(min)) min = 100;
  const label = min >= 45 ? 'Very easy to tell apart' : min >= 28 ? 'Easy to tell apart' : min >= 18 ? 'Some niches look alike' : 'Niches look alike';
  return { label, score: min };
}
