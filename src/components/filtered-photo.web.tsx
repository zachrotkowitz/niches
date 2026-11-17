import { createElement, useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { ColorMatrix as Matrix } from '@/lib/photo-edit';
import type { PickedPhoto } from '@/lib/photos';

// The web build's version of filtered-photo.tsx: the same color matrix,
// applied to the pixels of a canvas (Skia would need a large download on web).

function loadImage(uri: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = uri;
  });
}

function applyMatrix(data: Uint8ClampedArray, m: Matrix) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    data[i] = m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4] * 255;
    data[i + 1] = m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9] * 255;
    data[i + 2] = m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14] * 255;
  }
}

/** Draws `img` covering a w×h canvas, then runs the matrix over it. */
function draw(canvas: HTMLCanvasElement, img: HTMLImageElement, w: number, h: number, m: Matrix) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  const pixels = ctx.getImageData(0, 0, w, h);
  applyMatrix(pixels.data, m);
  ctx.putImageData(pixels, 0, 0);
}

export function FilteredPhoto({ uri, matrix, width, height, style }: { uri: string; matrix: Matrix; width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const img = useRef<{ uri: string; el: HTMLImageElement } | null>(null);
  const key = matrix.join(',');
  useEffect(() => {
    let live = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const run = (el: HTMLImageElement) => ref.current && draw(ref.current, el, Math.round(width * dpr), Math.round(height * dpr), matrix);
    if (img.current?.uri === uri) run(img.current.el);
    else
      loadImage(uri).then((el) => {
        if (!live) return;
        img.current = { uri, el };
        run(el);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, key, width, height]);
  return (
    <View style={[{ width, height, overflow: 'hidden', backgroundColor: '#E3E5E1' }, style]}>
      {createElement('canvas', { ref, 'aria-label': 'Your photo', style: { width, height, display: 'block' } })}
    </View>
  );
}

export async function bakePhoto(photo: PickedPhoto, matrix: Matrix): Promise<PickedPhoto> {
  const el = await loadImage(photo.uri);
  const canvas = document.createElement('canvas');
  draw(canvas, el, el.naturalWidth, el.naturalHeight, matrix);
  return { uri: canvas.toDataURL('image/jpeg', 0.85), width: el.naturalWidth, height: el.naturalHeight };
}
