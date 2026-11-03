// Visual system for Niches. Every niche owns a color; the app re-tints to the
// niche you are in. Keep these in sync with the approved mockups.

export type NicheId = 'cooking' | 'art' | 'photography' | 'gym';

export type Niche = {
  id: NicheId;
  label: string;
  /** Buttons, selected states, icons. Passes 4.5:1 on white. */
  accent: string;
  /** The niche's tinted ground: headers, panels, tags. */
  field: string;
  /** Text on the field color. */
  ink: string;
  /** Secondary text on the field color. */
  inkSoft: string;
  /** Open for posting, or still "coming soon". */
  open: boolean;
};

export const NICHES: Record<NicheId, Niche> = {
  cooking: { id: 'cooking', label: 'Cooking', accent: '#1E6B47', field: '#E4F0E8', ink: '#123F2A', inkSoft: '#2E5A43', open: true },
  art: { id: 'art', label: 'Art', accent: '#3B3FCB', field: '#E8E9FB', ink: '#23267A', inkSoft: '#3A3E8F', open: false },
  photography: { id: 'photography', label: 'Photography', accent: '#9A5200', field: '#FBEEDB', ink: '#5C3100', inkSoft: '#6E4310', open: false },
  gym: { id: 'gym', label: 'Gym', accent: '#B0255A', field: '#FBE7EE', ink: '#6B1236', inkSoft: '#7E2A4B', open: false },
};

export const NICHE_ORDER: NicheId[] = ['cooking', 'art', 'photography', 'gym'];

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
