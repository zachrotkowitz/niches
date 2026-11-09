// Picking real photos from the camera roll. Photos are shrunk to a sensible
// size and kept on the device (demo); Supabase Storage replaces this later.

import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedPhoto = { uri: string; width: number; height: number };

/** Longest edge we keep. Big enough for a full-width phone photo, small enough to store. */
const MAX_EDGE = 1440;

/**
 * Opens the photo library and returns a resized copy, or null if the person
 * cancelled. `aspect` crops to a fixed shape when given (e.g. [1, 1] for avatars).
 */
export async function pickPhoto(aspect?: [number, number]): Promise<PickedPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!aspect,
    aspect,
    quality: 1,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  const longest = Math.max(asset.width || MAX_EDGE, asset.height || MAX_EDGE);
  const resize = longest > MAX_EDGE ? [{ resize: asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE } }] : [];
  const onWeb = Platform.OS === 'web';
  const shrunk = await manipulateAsync(asset.uri, resize, { compress: 0.75, format: SaveFormat.JPEG, base64: onWeb });

  // On the web, keep the photo inline so it survives a page reload.
  if (onWeb) return { uri: `data:image/jpeg;base64,${shrunk.base64}`, width: shrunk.width, height: shrunk.height };

  // On phones, move it out of the temporary cache so it's still there tomorrow.
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`);
    await new File(shrunk.uri).copy(dest);
    return { uri: dest.uri, width: shrunk.width, height: shrunk.height };
  } catch {
    return { uri: shrunk.uri, width: shrunk.width, height: shrunk.height };
  }
}
