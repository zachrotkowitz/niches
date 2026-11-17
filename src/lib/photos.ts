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
  return keep(result.assets[0]);
}

/**
 * Opens the camera and returns a resized copy, or null if the person cancelled
 * or said no to camera access. On the web this falls back to choosing a file.
 */
export async function takePhoto(): Promise<PickedPhoto | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets?.length) return null;
  return keep(result.assets[0]);
}

async function keep(asset: ImagePicker.ImagePickerAsset): Promise<PickedPhoto> {

  const longest = Math.max(asset.width || MAX_EDGE, asset.height || MAX_EDGE);
  const resize = longest > MAX_EDGE ? [{ resize: asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE } }] : [];
  const onWeb = Platform.OS === 'web';
  const shrunk = await manipulateAsync(asset.uri, resize, { compress: 0.75, format: SaveFormat.JPEG, base64: onWeb });

  return store(shrunk, onWeb);
}

type Manipulated = { uri: string; width: number; height: number; base64?: string };

/** Web: inline data so it survives a reload. Phones: move it out of the temporary cache. */
async function store(shrunk: Manipulated, onWeb: boolean): Promise<PickedPhoto> {
  if (onWeb) return { uri: `data:image/jpeg;base64,${shrunk.base64}`, width: shrunk.width, height: shrunk.height };
  try {
    const dest = newPhotoFile();
    await new File(shrunk.uri).copy(dest);
    return { uri: dest.uri, width: shrunk.width, height: shrunk.height };
  } catch {
    return { uri: shrunk.uri, width: shrunk.width, height: shrunk.height };
  }
}

function newPhotoFile() {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return new File(dir, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`);
}

/** Cuts out the framed part of a photo (from the Post tab's pinch-and-drag frame). */
export async function cropPhoto(photo: PickedPhoto, rect: { originX: number; originY: number; width: number; height: number }): Promise<PickedPhoto> {
  const onWeb = Platform.OS === 'web';
  const out = await manipulateAsync(photo.uri, [{ crop: rect }], { compress: 0.85, format: SaveFormat.JPEG, base64: onWeb });
  return store(out, onWeb);
}

/** Saves JPEG bytes made on the phone (a filtered photo) and returns it as a photo. */
export async function saveJpeg(bytes: Uint8Array, width: number, height: number): Promise<PickedPhoto> {
  const dest = newPhotoFile();
  await dest.write(bytes);
  return { uri: dest.uri, width, height };
}
