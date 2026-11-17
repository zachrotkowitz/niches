// Photo editing for the Post tab (founder's option A, Nov 17 2026): framing
// on the first screen (pinch and drag), then filters and adjustments.
//
// Everything color-related is one 4×5 color matrix, so the phone (Skia) and
// the web build (a canvas) show and save exactly the same result.

export type FilterId = 'original' | 'warm' | 'bright' | 'fresh' | 'film' | 'mono';

/** Slider values, each from -100 to 100. 0 means untouched. */
export type Adjustments = { brightness: number; contrast: number; warmth: number; saturation: number };

export type PhotoEdits = { filter: FilterId; adjust: Adjustments };

export const NO_ADJUSTMENTS: Adjustments = { brightness: 0, contrast: 0, warmth: 0, saturation: 0 };
export const NO_EDITS: PhotoEdits = { filter: 'original', adjust: NO_ADJUSTMENTS };

export const ADJUSTMENTS: { key: keyof Adjustments; label: string }[] = [
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'saturation', label: 'Saturation' },
];

/** Each filter is a starting set of adjustments (plus "fade", which lifts the darks like old film). */
export const FILTERS: { id: FilterId; label: string; base: Adjustments; fade?: number }[] = [
  { id: 'original', label: 'Original', base: NO_ADJUSTMENTS },
  { id: 'warm', label: 'Warm', base: { brightness: 4, contrast: 0, warmth: 45, saturation: 15 } },
  { id: 'bright', label: 'Bright', base: { brightness: 18, contrast: 10, warmth: 0, saturation: 5 } },
  { id: 'fresh', label: 'Fresh', base: { brightness: 2, contrast: 6, warmth: -15, saturation: 35 } },
  { id: 'film', label: 'Film', base: { brightness: 6, contrast: -14, warmth: 20, saturation: -18 }, fade: 0.05 },
  { id: 'mono', label: 'Mono', base: { brightness: 2, contrast: 14, warmth: 0, saturation: -100 } },
];

export type ColorMatrix = number[]; // 20 numbers, row-major 4×5; the last column is an offset from 0 to 1.

const IDENTITY: ColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** a then b (both 4×5 with an implied last row of 0 0 0 0 1). */
function concat(b: ColorMatrix, a: ColorMatrix): ColorMatrix {
  const out = new Array<number>(20).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = c === 4 ? b[r * 5 + 4] : 0;
      for (let k = 0; k < 4; k++) v += b[r * 5 + k] * a[k * 5 + c];
      out[r * 5 + c] = v;
    }
  }
  return out;
}

const clamp = (v: number) => Math.max(-100, Math.min(100, v));

/** The matrix for a filter plus the sliders on top of it. */
export function editMatrix(edits: PhotoEdits): ColorMatrix {
  const preset = FILTERS.find((f) => f.id === edits.filter) ?? FILTERS[0];
  const a = {
    brightness: clamp(preset.base.brightness + edits.adjust.brightness),
    contrast: clamp(preset.base.contrast + edits.adjust.contrast),
    warmth: clamp(preset.base.warmth + edits.adjust.warmth),
    saturation: clamp(preset.base.saturation + edits.adjust.saturation),
  };
  let m = IDENTITY;
  // Saturation, mixing toward gray by how bright each color looks.
  const s = 1 + a.saturation / 100;
  const [lr, lg, lb] = [0.2126, 0.7152, 0.0722];
  m = concat(
    [lr * (1 - s) + s, lg * (1 - s), lb * (1 - s), 0, 0, lr * (1 - s), lg * (1 - s) + s, lb * (1 - s), 0, 0, lr * (1 - s), lg * (1 - s), lb * (1 - s) + s, 0, 0, 0, 0, 0, 1, 0],
    m,
  );
  // Contrast around middle gray.
  const c = 1 + (a.contrast / 100) * 0.5;
  const co = 0.5 * (1 - c);
  m = concat([c, 0, 0, 0, co, 0, c, 0, 0, co, 0, 0, c, 0, co, 0, 0, 0, 1, 0], m);
  // Warmth: a little more red, a little less blue.
  const w = (a.warmth / 100) * 0.08;
  // Brightness, plus the filter's fade.
  const b = (a.brightness / 100) * 0.22;
  const fade = preset.fade ?? 0;
  m = concat([1 - fade, 0, 0, 0, b + w + fade, 0, 1 - fade, 0, 0, b + fade, 0, 0, 1 - fade, 0, b - w + fade, 0, 0, 0, 1, 0], m);
  return m;
}

export const isUnedited = (edits: PhotoEdits) => edits.filter === 'original' && Object.values(edits.adjust).every((v) => v === 0);

// ---------- Framing ----------

/** How the photo sits in the frame: zoom (1 = just fills it) and how far it's been dragged, in screen points. */
export type Framing = { zoom: number; x: number; y: number; square: boolean };
export const START_FRAMING: Framing = { zoom: 1, x: 0, y: 0, square: false };

export const MAX_ZOOM = 5;

/** Frame shape: the photo's own shape between 4:5 and 5:4 (like the feed), or a square. Height over width. */
export function frameRatio(photo: { width: number; height: number }, square: boolean) {
  return square ? 1 : Math.min(1.25, Math.max(0.8, photo.height / photo.width));
}

/** Size of the photo at zoom 1: just big enough to cover the frame. */
export function coverSize(photo: { width: number; height: number }, frameW: number, frameH: number) {
  const s = Math.max(frameW / photo.width, frameH / photo.height);
  return { w: photo.width * s, h: photo.height * s, s };
}

/** The part of the original photo (in its own pixels) that shows in the frame. */
export function cropRect(photo: { width: number; height: number }, frameW: number, frameH: number, f: Framing) {
  const { s } = coverSize(photo, frameW, frameH);
  const scale = s * f.zoom;
  const dw = photo.width * scale;
  const dh = photo.height * scale;
  const left = (dw - frameW) / 2 - f.x;
  const top = (dh - frameH) / 2 - f.y;
  const originX = Math.max(0, Math.round(left / scale));
  const originY = Math.max(0, Math.round(top / scale));
  return {
    originX,
    originY,
    width: Math.min(photo.width - originX, Math.round(frameW / scale)),
    height: Math.min(photo.height - originY, Math.round(frameH / scale)),
  };
}
