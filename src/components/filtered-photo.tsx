import { Canvas, ColorMatrix, Image as SkiaImage, ImageFormat, Skia, useImage } from '@shopify/react-native-skia';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { ColorMatrix as Matrix } from '@/lib/photo-edit';
import { saveJpeg, type PickedPhoto } from '@/lib/photos';

/**
 * A photo drawn with a color matrix (filters and sliders), live. On phones this
 * is Skia; `filtered-photo.web.tsx` does the same with a canvas.
 */
export function FilteredPhoto({ uri, matrix, width, height, style }: { uri: string; matrix: Matrix; width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const image = useImage(uri);
  return (
    <View style={[{ width, height, overflow: 'hidden', backgroundColor: '#E3E5E1' }, style]}>
      <Canvas style={{ width, height }}>
        {image ? (
          <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover">
            <ColorMatrix matrix={matrix} />
          </SkiaImage>
        ) : null}
      </Canvas>
    </View>
  );
}

/** Bakes the filter into a new full-size JPEG. */
export async function bakePhoto(photo: PickedPhoto, matrix: Matrix): Promise<PickedPhoto> {
  const data = await Skia.Data.fromURI(photo.uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) return photo;
  const w = image.width();
  const h = image.height();
  const surface = Skia.Surface.MakeOffscreen(w, h) ?? Skia.Surface.Make(w, h);
  if (!surface) return photo;
  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));
  surface.getCanvas().drawImage(image, 0, 0, paint);
  surface.flush();
  const snap = surface.makeImageSnapshot();
  const bytes = (snap.makeNonTextureImage() ?? snap).encodeToBytes(ImageFormat.JPEG, 88);
  return saveJpeg(bytes, w, h);
}
