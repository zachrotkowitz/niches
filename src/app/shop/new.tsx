import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraIcon, CheckIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { useToast } from '@/components/toast';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import { CATEGORIES, FEE_RATE, feeFor, formatPrice, SHOP_NICHES, type ListingFormat } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH, type NicheId } from '@/lib/theme';

const SWATCHES = ['#C8553D', '#C9A877', '#6E8B4E', '#E0A43A', '#8E2F4F', '#5A6FD0', '#2D3142', '#D98A3D'];

/** Turns "24", "$24.50", "24.5" into cents; null if not a price. */
function toCents(text: string): number | null {
  const n = Number(text.replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100);
}

/** List something for sale. */
export default function NewListingScreen() {
  const params = useLocalSearchParams<{ niche?: NicheId }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();

  const start = params.niche && SHOP_NICHES.includes(params.niche) ? params.niche : SHOP_NICHES.includes(state.niche) ? state.niche : 'cooking';
  const [nicheId, setNicheId] = useState<NicheId>(start);
  const [format, setFormat] = useState<ListingFormat>('physical');
  const [category, setCategory] = useState((CATEGORIES[start] ?? [])[0] ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [shipping, setShipping] = useState('5');
  const [stock, setStock] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const choosePhoto = async () => {
    const picked = await pickPhoto();
    if (picked) setPhoto(picked);
  };
  const [linkedPostId, setLinkedPostId] = useState<string | undefined>(undefined);
  const [ownWork, setOwnWork] = useState(false);
  const [noFood, setNoFood] = useState(false);

  const niche = niches[nicheId];
  const priceCents = toCents(price);
  const shippingCents = format === 'physical' ? (shipping.trim() === '' || shipping.trim() === '0' ? 0 : toCents(shipping)) : 0;
  const myPosts = state.posts.filter((p) => p.authorId === state.me?.id && p.niche === nicheId && !p.archived);
  const ready = !!state.me && title.trim().length > 2 && priceCents !== null && shippingCents !== null && ownWork && (nicheId !== 'cooking' || noFood);

  const pickNiche = (id: NicheId) => {
    setNicheId(id);
    setCategory((CATEGORIES[id] ?? [])[0] ?? '');
    setLinkedPostId(undefined);
  };

  const create = () => {
    if (!ready || !state.me || priceCents === null) return;
    const stockN = Number(stock);
    const id = actions.createListing({
      sellerId: state.me.id,
      niche: nicheId,
      title: title.trim(),
      description: description.trim() || 'No description yet.',
      category,
      format,
      priceCents,
      shippingCents: format === 'physical' ? shippingCents ?? 0 : undefined,
      stock: format === 'physical' && Number.isInteger(stockN) && stockN > 0 ? stockN : undefined,
      linkedPostId,
      mediaColor: photo ? '#E3E5E1' : SWATCHES[Math.floor(Math.random() * SWATCHES.length)],
      imageUri: photo?.uri,
      mediaLabel: title.trim(),
    });
    toast(`Listed in the ${niche.label} shop`);
    router.replace({ pathname: '/shop/[id]', params: { id } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'transparent' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.nav, { paddingTop: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.navButton}>
          <Text style={[styles.navText, { color: niche.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={styles.navTitle}>Sell something</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready }} disabled={!ready} onPress={create} style={[styles.navButton, { alignItems: 'flex-end' }]}>
          <Text style={[styles.navText, { color: niche.accent, fontWeight: '700', opacity: ready ? 1 : 0.4 }]}>List it</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Field label="Which shop?">
          <View style={styles.wrap}>
            {SHOP_NICHES.map((id) => {
              const n = niches[id];
              const on = id === nicheId;
              return (
                <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => pickNiche(id)} style={[styles.chip, { borderColor: n.accent, borderWidth: 2.5 }, on ? { backgroundColor: n.accent } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{n.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {photo ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Change photo" onPress={choosePhoto} style={[styles.photo, { overflow: 'hidden', backgroundColor: '#E3E5E1' }]}>
            <Image source={{ uri: photo.uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={choosePhoto} style={styles.picker}>
            <CameraIcon color={colors.textBody} />
            <Text style={styles.pickerTitle}>Add a photo</Text>
            <Text style={styles.hint}>From your camera roll. Optional: without one, the listing gets a color block.</Text>
          </Pressable>
        )}

        <View accessibilityRole="radiogroup" accessibilityLabel="Format" style={styles.segment}>
          {(['physical', 'digital'] as ListingFormat[]).map((f) => {
            const on = f === format;
            return (
              <Pressable key={f} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setFormat(f)} style={[styles.segmentOption, on ? styles.segmentOn : null]}>
                <Text style={[styles.segmentText, { color: on ? colors.text : colors.textMuted }]}>{f === 'physical' ? 'Physical item' : 'Digital download'}</Text>
              </Pressable>
            );
          })}
        </View>
        {format === 'digital' ? (
          <Text style={[styles.note, { backgroundColor: colors.note }]}>Digital items like PDFs and presets are delivered as downloads. When real payments arrive, Apple’s rules for digital goods bought in the iPhone app may change how these are sold.</Text>
        ) : null}

        <Field label="Category">
          <View style={styles.wrap}>
            {(CATEGORIES[nicheId] ?? []).map((c) => {
              const on = c === category;
              return (
                <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setCategory(c)} style={[styles.chip, on ? { backgroundColor: colors.text, borderColor: colors.text } : null]}>
                  <Text style={[styles.chipText, { color: on ? '#FFFFFF' : colors.textBody }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Title">
          <TextInput accessibilityLabel="Title" value={title} onChangeText={setTitle} placeholder={nicheId === 'cooking' ? 'e.g. Weeknight Loaves (printed)' : 'e.g. Harbor at Dusk, 8×10 print'} placeholderTextColor="#6B7178" maxLength={70} style={styles.input} selectionColor={niche.accent} />
        </Field>

        <Field label="Description">
          <TextInput accessibilityLabel="Description" value={description} onChangeText={setDescription} multiline maxLength={1000} placeholder="What is it, how is it made, what size?" placeholderTextColor="#6B7178" style={[styles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]} selectionColor={niche.accent} />
        </Field>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Price ($)">
              <TextInput accessibilityLabel="Price in dollars" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="24" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
            </Field>
          </View>
          {format === 'physical' ? (
            <>
              <View style={{ flex: 1 }}>
                <Field label="Shipping ($)">
                  <TextInput accessibilityLabel="Shipping in dollars" value={shipping} onChangeText={setShipping} keyboardType="decimal-pad" placeholder="0 = free" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="How many?">
                  <TextInput accessibilityLabel="How many you have" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="Made to order" placeholderTextColor="#6B7178" style={styles.input} selectionColor={niche.accent} />
                </Field>
              </View>
            </>
          ) : null}
        </View>
        {priceCents !== null ? (
          <Text style={styles.earn}>
            You’ll earn {formatPrice(priceCents - feeFor(priceCents))} per sale. Niches keeps {Math.round(FEE_RATE * 100)}% ({formatPrice(feeFor(priceCents))}). Buyers pay no extra fees.
          </Text>
        ) : price ? (
          <Text style={[styles.earn, { color: colors.danger }]}>Enter a price in dollars, like 24 or 24.50.</Text>
        ) : null}

        {myPosts.length ? (
          <Field label="Show it under one of your posts (optional)">
            <View style={{ gap: 6 }}>
              {myPosts.slice(0, 5).map((p) => {
                const on = p.id === linkedPostId;
                return (
                  <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setLinkedPostId(on ? undefined : p.id)} style={[styles.postOption, on ? { borderColor: niche.accent, backgroundColor: niche.field } : null]}>
                    <View style={[styles.postThumb, { backgroundColor: p.mediaColor ?? niche.field }]} />
                    <Text style={styles.postText} numberOfLines={2}>{p.caption}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        ) : null}

        <View style={{ gap: 4 }}>
          <Check checked={ownWork} onPress={() => setOwnWork(!ownWork)} accent={niche.accent} label="This is my own work" detail="Not copied, and not AI-generated art passed off as handmade." />
          {nicheId === 'cooking' ? (
            <Check checked={noFood} onPress={() => setNoFood(!noFood)} accent={niche.accent} label="This isn’t food" detail="Food can’t be sold on Niches (home-food laws vary by state). Recipes, cookbooks and kitchen prints are welcome." />
          ) : null}
        </View>

        <Button label="List it" color={niche.accent} disabled={!ready} onPress={create} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Check({ checked, onPress, label, detail, accent }: { checked: boolean; onPress: () => void; label: string; detail: string; accent: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityHint={detail} onPress={onPress} style={styles.check}>
      <View style={[styles.box, checked ? { backgroundColor: accent, borderColor: accent } : null]}>{checked ? <CheckIcon size={15} strokeWidth={3} /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={styles.checkDetail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  navButton: { minWidth: 80, minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12 },
  navText: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 14, fontWeight: '600' },
  picker: { height: 160, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9BFB8', backgroundColor: '#F7F8F5', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 24 },
  pickerTitle: { fontSize: 15, fontWeight: '600', color: colors.textBody },
  photo: { height: 200, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
  segment: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#F0F1EE' },
  segmentOption: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: '#FFFFFF', shadowColor: '#14161A', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  note: { fontSize: 13, lineHeight: 18, color: '#5C4A00', padding: 12, borderRadius: 12, overflow: 'hidden', marginTop: -8 },
  input: { minHeight: TOUCH + 4, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: '#FFFFFF' },
  earn: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: -8 },
  postOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border },
  postThumb: { width: 44, height: 44, borderRadius: 8 },
  postText: { flex: 1, fontSize: 14, color: colors.text },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, minHeight: TOUCH },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: '#9AA19B', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  checkDetail: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
