import { useState } from 'react';
import { Image as RNImage, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInLeft, FadeInRight, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CropFrame } from '@/components/crop-frame';
import { bakePhoto, FilteredPhoto } from '@/components/filtered-photo';
import { ChevronLeftIcon, CloseIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { AdjustSlider } from '@/components/slider';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { UnderlineTabs } from '@/components/underline-tabs';
import { ADJUSTMENTS, cropRect, editMatrix, FILTERS, frameRatio, isUnedited, NO_EDITS, START_FRAMING, type Framing, type PhotoEdits } from '@/lib/photo-edit';
import { cropPhoto, type PickedPhoto } from '@/lib/photos';
import { useAppGround } from '@/lib/store';
import { groundSurface, TOUCH } from '@/lib/theme';

const ease = Easing.out(Easing.cubic);
const pageIn = (from: 'left' | 'right') =>
  (from === 'right' ? FadeInRight : FadeInLeft).duration(280).easing(ease).reduceMotion(ReduceMotion.System);

/**
 * The Post tab's crop and edit steps as one full-screen editor, for listing
 * photos (founder, Nov 24 2026): frame it (pinch, drag, photo shape or
 * square), then Filters / Adjust, then Done hands back the new photo.
 */
export function PhotoEditor({ photo, title, onCancel, onDone }: { photo: PickedPhoto | null; title: string; onCancel: () => void; onDone: (p: PickedPhoto) => void }) {
  const insets = useSafeAreaInsets();
  const ground = useAppGround();
  const { width, height } = useWindowDimensions();
  const [framing, setFraming] = useState<Framing>(START_FRAMING);
  const [cropped, setCropped] = useState<PickedPhoto | null>(null);
  const [edits, setEdits] = useState<PhotoEdits>(NO_EDITS);
  const [working, setWorking] = useState(false);
  const w = Math.min(width, 640);
  const ratio = photo ? frameRatio(photo, framing.square) : 1;
  const previewH = Math.round(Math.min(w * ratio, height * 0.62));

  const reset = () => {
    setFraming(START_FRAMING);
    setCropped(null);
    setEdits(NO_EDITS);
  };
  const close = () => (reset(), onCancel());

  return (
    <Modal visible={!!photo} animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: ground.ground }}>
        {photo && !cropped ? (
          <SurfaceProvider value={groundSurface(ground)}>
            <View style={{ flex: 1, paddingTop: insets.top + 4, alignItems: 'center' }}>
              <View style={[styles.stepBar, { width: w }]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={close} style={styles.stepIcon}>
                  <CloseIcon color={ground.text} />
                </Pressable>
                <DisplayText size={24} color={ground.text}>{title}</DisplayText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: working, busy: working }}
                  disabled={working}
                  onPress={async () => {
                    setWorking(true);
                    try {
                      setCropped(await cropPhoto(photo, cropRect(photo, w, previewH, framing)));
                    } finally {
                      setWorking(false);
                    }
                  }}
                  style={({ pressed }) => [styles.share, { backgroundColor: ground.text, opacity: working ? 0.6 : pressed ? 0.8 : 1 }]}>
                  <Text style={[styles.shareText, { color: ground.ground }]}>{working ? 'One sec…' : 'Next'}</Text>
                </Pressable>
              </View>
              <Animated.View entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}>
                <CropFrame photo={photo} width={w} height={previewH} framing={framing} onChange={setFraming} />
              </Animated.View>
            </View>
          </SurfaceProvider>
        ) : null}
        {photo && cropped ? (
          <EditStep
            photo={cropped}
            edits={edits}
            onEdits={setEdits}
            working={working}
            nextLabel="Done"
            onBack={() => setCropped(null)}
            onNext={async () => {
              setWorking(true);
              try {
                const out = isUnedited(edits) ? cropped : await bakePhoto(cropped, editMatrix(edits));
                reset();
                onDone(out);
              } finally {
                setWorking(false);
              }
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

/** Fills in a photo's size when we only have its address (e.g. a post's photo). */
export function withSize(uri: string): Promise<PickedPhoto> {
  return new Promise((resolve) => RNImage.getSize(uri, (width, height) => resolve({ uri, width, height }), () => resolve({ uri, width: 1080, height: 1080 })));
}

/**
 * Step two (founder's option A): the framed photo with Filters (tiles you tap)
 * and Adjust (four sliders). Next saves the look into the photo.
 */
export function EditStep({ photo, edits, onEdits, working, onBack, onNext, nextLabel = 'Next' }: { photo: PickedPhoto; edits: PhotoEdits; onEdits: (e: PhotoEdits) => void; working: boolean; onBack: () => void; onNext: () => void; nextLabel?: string }) {
  const insets = useSafeAreaInsets();
  const ground = useAppGround();
  const { width, height } = useWindowDimensions();
  const [tab, setTab] = useState<'filters' | 'adjust'>('filters');
  const w = Math.min(width, 640);
  const ratio = photo.height / photo.width;
  const previewH = Math.round(Math.min(w * ratio, height * 0.47));
  const previewW = Math.round(previewH / ratio);
  const matrix = editMatrix(edits);

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <Animated.View entering={pageIn('right')} style={{ flex: 1, paddingTop: insets.top + 4, alignItems: 'center' }}>
        <View style={[styles.stepBar, { width: w }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to framing" onPress={onBack} style={styles.stepIcon}>
            <ChevronLeftIcon color={ground.text} />
          </Pressable>
          <DisplayText size={24} color={ground.text}>Edit</DisplayText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: working, busy: working }}
            disabled={working}
            onPress={onNext}
            style={({ pressed }) => [styles.share, { backgroundColor: ground.text, opacity: working ? 0.6 : pressed ? 0.8 : 1 }]}>
            <Text style={[styles.shareText, { color: ground.ground }]}>{working ? 'One sec…' : nextLabel}</Text>
          </Pressable>
        </View>

        <View style={{ width: w, height: previewH, alignItems: 'center', backgroundColor: ground.line }}>
          <FilteredPhoto uri={photo.uri} matrix={matrix} width={previewW} height={previewH} />
        </View>

        <View style={{ width: w, marginTop: 8 }}>
          <UnderlineTabs
            label="Edit tools"
            inset={10}
            value={tab}
            onChange={(k) => setTab(k as 'filters' | 'adjust')}
            items={[
              { key: 'filters', label: 'Filters' },
              { key: 'adjust', label: 'Adjust' },
            ]}
          />
        </View>

        {tab === 'filters' ? (
          <Animated.View key="filters" entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)} style={{ width: w }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => {
                const on = f.id === edits.filter;
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${f.label} filter`}
                    onPress={() => onEdits({ ...edits, filter: f.id })}
                    style={({ pressed }) => [styles.filterTile, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                    <View style={[styles.filterThumb, { borderColor: on ? ground.text : 'transparent' }]}>
                      <FilteredPhoto uri={photo.uri} matrix={editMatrix({ filter: f.id, adjust: edits.adjust })} width={72} height={88} style={{ borderRadius: 11 }} />
                    </View>
                    <Text style={[styles.filterName, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500' }]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View key="adjust" entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)} style={{ width: w, paddingTop: 8 }}>
            {ADJUSTMENTS.map((a) => (
              <AdjustSlider key={a.key} label={a.label} value={edits.adjust[a.key]} onChange={(v) => onEdits({ ...edits, adjust: { ...edits.adjust, [a.key]: v } })} />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    </SurfaceProvider>
  );
}


const styles = StyleSheet.create({
  share: { minHeight: 40, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareText: { fontSize: 15, fontWeight: '700' },
  stepBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6, paddingRight: 14, marginBottom: 6 },
  stepIcon: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  filterRow: { gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  filterTile: { alignItems: 'center', gap: 6 },
  filterThumb: { borderRadius: 14, borderWidth: 2.5, padding: 1.5 },
  filterName: { fontSize: 12 },
});
