import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverCollage, CoverFrame } from '@/components/cover';
import { Eyebrow } from '@/components/discover-parts';
import { Button, DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { COVER_LAYOUTS, coverCandidates, coverCount, coverFor, type CoverLayout } from '@/lib/cover';
import { postPhoto } from '@/lib/demo-photos';
import { useAppGround, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

/**
 * "Style your cover", opened from Edit profile. Pick a layout (one, two or
 * three photos), tap a spot in the preview, then tap one of your posts to put
 * it there. Starts from the cover the profile already shows.
 */
export default function CoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { state, actions } = useStore();
  const ground = useAppGround();
  const me = state.me;
  const pool = me ? coverCandidates(state.posts, me.id) : [];
  const current = me ? coverFor(me, state.posts) : null;
  const [layout, setLayout] = useState<CoverLayout>(current?.layout ?? 'one');
  const [ids, setIds] = useState<string[]>(current?.posts.map((p) => p.id) ?? []);
  const [slot, setSlot] = useState(0);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  if (!me) return null;

  const count = coverCount(layout);
  // Fill any empty spots with your next photos, so a layout never shows a blank.
  const filled = (list: string[], n: number) => {
    const out = list.slice(0, n);
    for (const p of pool) {
      if (out.length >= n) break;
      if (!out.includes(p.id)) out.push(p.id);
    }
    return out;
  };
  const shownIds = filled(ids, count);
  const shown = shownIds.map((id) => pool.find((p) => p.id === id));
  const activeSlot = Math.min(slot, Math.max(0, shownIds.length - 1));

  const pickLayout = (next: CoverLayout) => {
    setLayout(next);
    setIds(filled(ids, coverCount(next)));
    setSlot(0);
  };
  const pickPost = (id: string) => {
    const next = [...shownIds];
    const at = next.indexOf(id);
    // Already on the cover: swap the two spots.
    if (at >= 0) next[at] = next[activeSlot];
    next[activeSlot] = id;
    setIds(next);
    setSlot((activeSlot + 1) % count);
  };
  const save = () => {
    actions.setCover({ layout, postIds: shownIds });
    toast('Cover updated');
    close();
  };
  const tile = Math.floor((Math.min(width, 560) - 40 - 16) / 3);

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <View style={{ flex: 1, backgroundColor: ground.ground }}>
        <View style={[styles.top, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 8, borderBottomColor: ground.line }]}>
          <Pressable accessibilityRole="button" onPress={close} style={styles.topButton}>
            <Text style={[styles.topText, { color: ground.text, fontWeight: '500' }]}>Cancel</Text>
          </Pressable>
          <DisplayText size={28} color={ground.text}>Style your cover</DisplayText>
          <Pressable accessibilityRole="button" disabled={!pool.length} onPress={save} style={[styles.topButton, { alignItems: 'flex-end', opacity: pool.length ? 1 : 0.4 }]}>
            <Text style={[styles.topText, { color: ground.text }]}>Done</Text>
          </Pressable>
        </View>

        {pool.length === 0 ? (
          <View style={styles.none}>
            <Text style={[styles.noneTitle, { color: ground.text }]}>Post a photo first.</Text>
            <Text style={[styles.noneBody, { color: ground.body }]}>Your cover is made from your own photo posts. Share one and it will show up here.</Text>
            <Button label="Create a post" color={ground.text} onPress={() => router.navigate('/create')} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 22 }}>
            <View>
              <CoverCollage layout={layout} posts={shown} style={styles.preview} />
              {/* Tap a spot to choose which photo you're changing. */}
              <CoverFrame
                layout={layout}
                style={[styles.preview, StyleSheet.absoluteFill]}
                cell={(i) =>
                  i < count ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: i === activeSlot }}
                      accessibilityLabel={`Photo ${i + 1}${i === activeSlot ? ', selected' : ''}`}
                      onPress={() => setSlot(i)}
                      style={[StyleSheet.absoluteFill, styles.slot, i === activeSlot && count > 1 ? { borderColor: '#FFFFFF', borderWidth: 3 } : null]}>
                      {count > 1 ? (
                        <View style={[styles.badge, i === activeSlot ? { backgroundColor: ground.text } : null]}>
                          <Text style={[styles.badgeText, { color: i === activeSlot ? '#FFFFFF' : ground.text }]}>{i + 1}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ) : null
                }
              />
            </View>

            <View style={{ gap: 10 }}>
              <Eyebrow>Layout</Eyebrow>
              <View accessibilityRole="radiogroup" style={styles.layouts}>
                {COVER_LAYOUTS.map((l) => {
                  const on = l.id === layout;
                  const enough = pool.length >= l.count;
                  return (
                    <Pressable
                      key={l.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: !enough }}
                      accessibilityLabel={l.label}
                      disabled={!enough}
                      onPress={() => pickLayout(l.id)}
                      style={{ width: tile, gap: 6, opacity: enough ? 1 : 0.4 }}>
                      <View style={[styles.thumb, { borderColor: on ? ground.text : ground.line }]}>
                        <CoverFrame layout={l.id} gap={3} style={{ flex: 1 }} cell={() => <View style={[StyleSheet.absoluteFill, { borderRadius: 6, backgroundColor: on ? ground.muted : '#CFC4B0' }]} />} />
                      </View>
                      <Text style={[styles.thumbLabel, { color: ground.text, fontWeight: on ? '700' : '500' }]}>{l.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {pool.length < 3 ? <Text style={[styles.hint, { color: ground.muted }]}>Layouts with more photos unlock as you post more.</Text> : null}
            </View>

            <View style={{ gap: 10 }}>
              <View style={styles.rowHead}>
                <Eyebrow>Your photos</Eyebrow>
                <Text style={[styles.hint, { color: ground.muted }]}>{count > 1 ? `Tap one for spot ${activeSlot + 1}` : 'Tap one to use it'}</Text>
              </View>
              <View style={styles.photos}>
                {pool.map((p) => {
                  const at = shownIds.indexOf(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${p.mediaLabel ?? 'Photo'}${at >= 0 ? `, on your cover in spot ${at + 1}` : ''}`}
                      onPress={() => pickPost(p.id)}
                      style={({ pressed }) => [{ width: tile, height: tile, borderRadius: 14, overflow: 'hidden', backgroundColor: p.mediaColor }, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                      <Image source={postPhoto(p)} contentFit="cover" style={StyleSheet.absoluteFill} />
                      {at >= 0 ? (
                        <View style={[styles.badge, { backgroundColor: ground.text }]}>
                          <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{count > 1 ? at + 1 : '✓'}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {me.cover ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  actions.setCover(undefined);
                  toast('Cover is automatic again');
                  close();
                }}
                style={styles.auto}>
                <Text style={[styles.autoText, { color: ground.muted }]}>Use my most-saved photos instead</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </View>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  topButton: { minHeight: TOUCH, minWidth: 64, justifyContent: 'center' },
  topText: { fontSize: 16, fontWeight: '700' },
  preview: { height: 210, borderRadius: 22 },
  slot: { borderRadius: 0 },
  badge: { position: 'absolute', left: 8, top: 8, minWidth: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 13, fontWeight: '800' },
  layouts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 8 },
  thumb: { height: 72, padding: 4, borderRadius: 14, borderWidth: 2.5, backgroundColor: '#FFFFFF' },
  thumbLabel: { fontSize: 12, lineHeight: 15 },
  hint: { fontSize: 13 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 8 },
  auto: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  autoText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  none: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', gap: 10 },
  noneTitle: { fontSize: 26, fontFamily: fonts.displayItalic },
  noneBody: { fontSize: 15, lineHeight: 21 },
});
