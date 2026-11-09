// Demo photos for the made-up seed content (posts, shop listings, diary entries),
// bundled with the app so it can be shown to people with real images.
// All CC0 or public domain; see assets/demo/CREDITS.md. Real user photos
// (imageUri) always win over these.

/** A bundled image (require) or a file/data URI. Works with expo-image and React Native's Image. */
export type Photo = number | { uri: string };

type Demo = { src: Photo; aspect: number };

/* eslint-disable @typescript-eslint/no-require-imports */
const PHOTOS: Record<string, Demo> = {
  beets: { src: require('../../assets/demo/beets.jpg'), aspect: 0.897 },
  bibimbap: { src: require('../../assets/demo/bibimbap.jpg'), aspect: 0.562 },
  burger: { src: require('../../assets/demo/burger.jpg'), aspect: 0.750 },
  camera: { src: require('../../assets/demo/camera.jpg'), aspect: 0.503 },
  carbonara: { src: require('../../assets/demo/carbonara.jpg'), aspect: 1.000 },
  corn: { src: require('../../assets/demo/corn.jpg'), aspect: 0.750 },
  dal: { src: require('../../assets/demo/dal.jpg'), aspect: 0.750 },
  eggs: { src: require('../../assets/demo/eggs.jpg'), aspect: 0.750 },
  focaccia: { src: require('../../assets/demo/focaccia.jpg'), aspect: 0.750 },
  fog: { src: require('../../assets/demo/fog.jpg'), aspect: 0.477 },
  galette: { src: require('../../assets/demo/galette.jpg'), aspect: 0.666 },
  gnocchi: { src: require('../../assets/demo/gnocchi.jpg'), aspect: 1.333 },
  golden: { src: require('../../assets/demo/golden.jpg'), aspect: 0.666 },
  harbor: { src: require('../../assets/demo/harbor.jpg'), aspect: 0.600 },
  herboil: { src: require('../../assets/demo/herboil.jpg'), aspect: 0.750 },
  lemons: { src: require('../../assets/demo/lemons.jpg'), aspect: 1.365 },
  market: { src: require('../../assets/demo/market.jpg'), aspect: 0.490 },
  mealprep: { src: require('../../assets/demo/mealprep.jpg'), aspect: 0.750 },
  night: { src: require('../../assets/demo/night.jpg'), aspect: 0.562 },
  noodles: { src: require('../../assets/demo/noodles.jpg'), aspect: 1.000 },
  palette: { src: require('../../assets/demo/palette.jpg'), aspect: 0.750 },
  pancakes: { src: require('../../assets/demo/pancakes.jpg'), aspect: 0.750 },
  pansauce: { src: require('../../assets/demo/pansauce.jpg'), aspect: 0.750 },
  petportrait: { src: require('../../assets/demo/petportrait.jpg'), aspect: 1.035 },
  pierogi: { src: require('../../assets/demo/pierogi.jpg'), aspect: 0.750 },
  ravioli: { src: require('../../assets/demo/ravioli.jpg'), aspect: 0.750 },
  risotto: { src: require('../../assets/demo/risotto.jpg'), aspect: 0.750 },
  shakshuka: { src: require('../../assets/demo/shakshuka.jpg'), aspect: 0.750 },
  shortrib: { src: require('../../assets/demo/shortrib.jpg'), aspect: 0.750 },
  sourdough: { src: require('../../assets/demo/sourdough.jpg'), aspect: 1.333 },
  street: { src: require('../../assets/demo/street.jpg'), aspect: 0.620 },
  tacos: { src: require('../../assets/demo/tacos.jpg'), aspect: 0.837 },
  tagliatelle: { src: require('../../assets/demo/tagliatelle.jpg'), aspect: 0.667 },
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Seed post id → photo. */
const POSTS: Record<string, string> = {
  p_tagliatelle: 'tagliatelle', p_sourdough: 'sourdough', p_chili: 'noodles', p_corn: 'corn', p_herboil: 'herboil',
  p_beets: 'beets', p_risotto: 'risotto', p_gnocchi: 'gnocchi', p_ravioli: 'ravioli', p_ines_sauce: 'pansauce',
  p_ines_shortrib: 'shortrib', p_dax_eggs: 'eggs', p_dax_trailer: 'mealprep', p_art_process: 'palette',
  p_art_harbor: 'harbor', p_art_street: 'street', p_art_lemons: 'lemons', p_art_figure: 'petportrait',
  p_photo_raw: 'camera', p_photo_golden: 'golden', p_photo_night: 'night', p_photo_market: 'market', p_photo_fog: 'fog',
};

/** Seed shop listing id → photo. */
const LISTINGS: Record<string, string> = {
  l_pasta_notes: 'tagliatelle', l_weeknight_loaves: 'sourdough', l_chili_crisp: 'noodles', l_weeknight_fancy: 'beets',
  l_herb_chart: 'herboil', l_harbor_original: 'harbor', l_harbor_print: 'harbor', l_corner_store: 'street',
  l_street_zine: 'street', l_golden_print: 'golden', l_portra_presets: 'camera', l_rain_print: 'night',
};

/** Words in a diary entry's title → photo, for entries not made from a post (like the sample year). */
const DISH_WORDS: [string, string][] = [
  ['sourdough', 'sourdough'], ['loaf', 'sourdough'], ['carbonara', 'carbonara'], ['shakshuka', 'shakshuka'], ['dal', 'dal'],
  ['focaccia', 'focaccia'], ['gnocchi', 'gnocchi'], ['bibimbap', 'bibimbap'], ['taco', 'tacos'], ['pierogi', 'pierogi'],
  ['pancake', 'pancakes'], ['burger', 'burger'], ['pad see ew', 'noodles'], ['noodle', 'noodles'], ['galette', 'galette'],
  ['herb oil', 'herboil'], ['beet', 'beets'], ['corn', 'corn'], ['tagliatelle', 'tagliatelle'], ['chili crisp', 'noodles'],
  ['ravioli', 'ravioli'], ['risotto', 'risotto'],
];

const get = (key?: string) => (key ? PHOTOS[key] : undefined);

function forPost(id: string) {
  return get(POSTS[id]);
}

/** The image to show for a post: your own photo, else its demo photo. */
export function postPhoto(p: { id: string; imageUri?: string }): Photo | undefined {
  return p.imageUri ? { uri: p.imageUri } : forPost(p.id)?.src;
}

/** Height ÷ width of a post's photo, when known. */
export function postAspect(p: { id: string; imageUri?: string; imageAspect?: number }): number | undefined {
  return p.imageUri ? p.imageAspect : forPost(p.id)?.aspect;
}

export function listingPhoto(l: { id: string; imageUri?: string }): Photo | undefined {
  return l.imageUri ? { uri: l.imageUri } : get(LISTINGS[l.id])?.src;
}

/** A diary entry's own photo, else the photo of the post it came from, else a photo matching the dish. */
export function logPhoto(l: { postId?: string; title: string; imageUri?: string }): Photo | undefined {
  if (l.imageUri) return { uri: l.imageUri };
  if (l.postId && POSTS[l.postId]) return get(POSTS[l.postId])?.src;
  const t = l.title.toLowerCase();
  const hit = DISH_WORDS.find(([w]) => t.includes(w));
  return get(hit?.[1])?.src;
}
