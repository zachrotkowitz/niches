import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { CameraIcon, CheckIcon, CloseIcon, PlusIcon } from '@/components/icons';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { postPhoto } from '@/lib/demo-photos';
import { pickPhoto, type PickedPhoto } from '@/lib/photos';
import { PhotoEditor, withSize } from '@/components/photo-editor';
import { DraftPrompt } from '@/components/draft-prompt';
import { CATEGORIES, feeFor, formatPrice, SHOP_NICHES, type ListingFormat } from '@/lib/shop';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, type NicheId } from '@/lib/theme';
import { shortTitle } from '@/lib/format';

const MAX_PHOTOS = 8;
const SWATCHES = ['#C8553D', '#C9A877', '#6E8B4E', '#E0A43A', '#8E2F4F', '#5A6FD0', '#2D3142', '#D98A3D'];
const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

/** Turns "24", "$24.50", "24.5" into cents; null if not a price. */
function toCents(text: string): number | null {
  const n = Number(text.replace(/[$,\s]/g, ''));
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100);
}

/**
 * Sell something (founder picked option E, Nov 24 2026; canvas page "Shop",
 * row "Sell something · round 2"): the photo big at the top like the listing
 * page buyers see, the title in a white card, Price and Shipping boxes,
 * Description, then single rows for Delivery method, Quantity, Kind
 * (optional, with Other to type your own), Shop and the Shop this bar, one
 * check, and one long "List it · $24" bar fixed at the bottom.
 * `postId` fills it in from one of your posts.
 */
export default function NewListingScreen() {
  const params = useLocalSearchParams<{ niche?: NicheId; postId?: string; draft?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const draft = params.draft ? state.listingDrafts.find((d) => d.id === params.draft && d.sellerId === state.me?.id) : undefined;
  const fromPost = !draft && params.postId ? state.posts.find((p) => p.id === params.postId && p.authorId === state.me?.id) : undefined;

  const pick = (id?: string): NicheId | undefined => (id && SHOP_NICHES.includes(id as NicheId) ? (id as NicheId) : undefined);
  const start = pick(draft?.niche) ?? pick(fromPost?.niche) ?? pick(params.niche) ?? pick(state.niche) ?? 'cooking';
  // Where the form started (a draft, a post or empty), so backing out only asks "Save as draft?" after a change.
  const [initial] = useState(() => ({
    niche: start,
    format: draft?.format ?? ('physical' as ListingFormat),
    kind: draft?.kind ?? '',
    other: draft?.other ?? '',
    title: draft?.title ?? (fromPost ? shortTitle(fromPost.mediaLabel || fromPost.caption, 60) : ''),
    description: draft?.description ?? '',
    price: draft?.price ?? '',
    shipping: draft?.shipping ?? '5',
    quantity: draft?.quantity ?? '',
    photos: draft?.photos ?? (fromPost?.imageUri ? [fromPost.imageUri] : []),
    linkedPostId: draft ? draft.linkedPostId : fromPost?.id,
  }));
  const [nicheId, setNicheId] = useState<NicheId>(initial.niche);
  const [format, setFormat] = useState<ListingFormat>(initial.format);
  const [kind, setKind] = useState(initial.kind);
  const [other, setOther] = useState(initial.other);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(initial.price);
  const [shipping, setShipping] = useState(initial.shipping);
  const [quantity, setQuantity] = useState(initial.quantity);
  // Several photos (founder, Nov 24 2026): the first is the cover; buyers swipe through the rest.
  const [photos, setPhotos] = useState<string[]>(initial.photos);
  const [shown, setShown] = useState(0);
  const [linkedPostId, setLinkedPostId] = useState<string | undefined>(initial.linkedPostId);
  const [askDraft, setAskDraft] = useState(false);
  const [choosingPost, setChoosingPost] = useState(false);
  const [ownWork, setOwnWork] = useState(false);

  const niche = niches[nicheId];
  const priceCents = toCents(price);
  const shippingCents = format === 'physical' ? (shipping.trim() === '' || shipping.trim() === '0' ? 0 : toCents(shipping)) : 0;
  const myPosts = state.posts.filter((p) => p.authorId === state.me?.id && p.niche === nicheId && !p.archived);
  const linked = myPosts.find((p) => p.id === linkedPostId);
  const category = kind === 'other' ? other.trim() : kind;
  const ready = !!state.me && title.trim().length > 2 && priceCents !== null && shippingCents !== null && ownWork;
  const seen = photos[shown] ? { uri: photos[shown] } : !photos.length && fromPost ? postPhoto(fromPost) : undefined;

  // Crop and edit like a post photo (founder, Nov 24 2026): every new photo opens the editor; Edit reopens it.
  const [editing, setEditing] = useState<{ photo: PickedPhoto; index: number | null } | null>(null);
  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const picked = await pickPhoto();
    if (picked) setEditing({ photo: picked, index: null });
  };
  const editPhoto = async (i: number) => setEditing({ photo: await withSize(photos[i]), index: i });
  const editDone = (p: PickedPhoto) => {
    if (!editing) return;
    if (editing.index === null) {
      setPhotos((ps) => [...ps, p.uri]);
      setShown(photos.length);
    } else {
      const at = editing.index;
      setPhotos((ps) => ps.map((u, j) => (j === at ? p.uri : u)));
    }
    setEditing(null);
  };
  const removePhoto = (i: number) => {
    setPhotos((ps) => ps.filter((_, j) => j !== i));
    setShown((n) => Math.max(0, n > i || n === photos.length - 1 ? n - 1 : n));
  };
  const makeCover = (i: number) => {
    setPhotos((ps) => [ps[i], ...ps.filter((_, j) => j !== i)]);
    setShown(0);
  };
  const pickNiche = (id: NicheId) => {
    setNicheId(id);
    setKind('');
    if (!fromPost) setLinkedPostId(undefined);
  };
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const now = { niche: nicheId, format, kind, other, title, description, price, shipping, quantity, photos, linkedPostId };
  const changed = JSON.stringify(now) !== JSON.stringify(initial);
  // Backing out after a change asks "Save as draft?" (founder, Nov 24 2026).
  // A saved draft always asks, so you can keep it or delete it without editing first (founder, Nov 24 2026).
  const close = () => (changed || draft ? setAskDraft(true) : leave());
  const saveDraft = () => {
    if (!state.me) return;
    actions.saveDraft({ id: draft?.id ?? `d_${Date.now().toString(36)}`, sellerId: state.me.id, ...now, savedAt: Date.now() });
    setAskDraft(false);
    toast('Saved to your drafts');
    leave();
  };
  const dropDraft = () => {
    if (draft) actions.deleteDraft(draft.id);
    setAskDraft(false);
    leave();
  };

  const create = () => {
    if (!ready || !state.me || priceCents === null) return;
    const q = Number(quantity);
    const id = actions.createListing({
      sellerId: state.me.id,
      niche: nicheId,
      title: title.trim(),
      description: description.trim() || 'No description yet.',
      category,
      format,
      priceCents,
      shippingCents: format === 'physical' ? shippingCents ?? 0 : undefined,
      stock: format === 'physical' && Number.isInteger(q) && q > 0 ? q : undefined,
      linkedPostId,
      mediaColor: photos.length ? '#E3E5E1' : linked?.mediaColor ?? SWATCHES[Math.floor(Math.random() * SWATCHES.length)],
      imageUri: photos[0],
      moreImageUris: photos.length > 1 ? photos.slice(1) : undefined,
      mediaLabel: title.trim(),
    });
    if (draft) actions.deleteDraft(draft.id);
    toast(`Listed in the ${niche.label} shop`);
    router.replace({ pathname: '/shop/[id]', params: { id } });
  };

  const box = (label: string, value: string, set: (v: string) => void, opts: { prefix?: string; sub?: string; placeholder?: string; flex?: number; keyboard?: 'decimal-pad' | 'number-pad' } = {}) => (
    <View style={[styles.numBox, { flex: opts.flex ?? 1 }]}>
      <Text style={[styles.boxLabel, { color: ground.muted }]}>{label}</Text>
      <View style={styles.numRow}>
        {opts.prefix ? <Text style={[styles.num, { color: value ? ground.text : ground.muted }]}>{opts.prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={set}
          keyboardType={opts.keyboard ?? 'decimal-pad'}
          placeholder={opts.placeholder}
          placeholderTextColor={ground.muted}
          selectionColor={niche.accent}
          style={[styles.num, styles.numInput, { color: ground.text }, webInput]}
        />
      </View>
      {opts.sub ? <Text style={[styles.boxSub, { color: ground.muted }]}>{opts.sub}</Text> : null}
    </View>
  );
  /** Plain words, the picked one underlined (quiet tabs that wrap instead of scroll). */
  const words = (label: string, items: { key: string; label: string; color?: string }[], value: string, onChange: (k: string) => void) => (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.words}>
      {items.map((i) => {
        const on = i.key === value;
        return (
          <Pressable key={i.key} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => onChange(i.key)} hitSlop={6} style={[styles.word, { borderBottomColor: on ? i.color ?? niche.accent : 'transparent' }]}>
            <Text style={[styles.wordText, { color: on ? ground.text : ground.muted, fontWeight: on ? '800' : '500' }]}>{i.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  const stacked = (label: string, inner: React.ReactNode, note?: string) => (
    <View style={[styles.kind, { borderBottomColor: ground.line }]}>
      <View style={styles.kindHead}>
        <Text style={[styles.rowLabel, { color: ground.text }]}>{label}</Text>
        {note ? <Text style={[styles.rowSub, { color: ground.muted }]}>{note}</Text> : null}
      </View>
      {inner}
    </View>
  );
  const row = (label: string, right: React.ReactNode, sub?: string) => (
    <View style={[styles.row, { borderBottomColor: ground.line }]}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={[styles.rowLabel, { color: ground.text }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, { color: ground.muted }]}>{sub}</Text> : null}
      </View>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );

  return (
    <SurfaceProvider value={ground}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ground.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* The photo, big, like the listing page buyers will see. */}
          <Pressable accessibilityRole="button" accessibilityLabel={seen ? `Photo ${shown + 1} of ${Math.max(1, photos.length)}` : 'Add a photo'} disabled={!!photos.length} onPress={addPhoto} style={[styles.photo, { backgroundColor: seen ? '#E3E5E1' : niche.mid }]}>
            {seen ? (
              <Image source={seen} contentFit="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.addPhoto}>
                <CameraIcon size={34} color={niche.ink} />
                <Text style={[styles.addPhotoText, { color: niche.ink }]}>Add photos</Text>
              </View>
            )}
          </Pressable>
          <View style={[styles.overPhoto, { top: insets.top + 10 }]} pointerEvents="box-none">
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.round}>
              <CloseIcon size={18} />
            </Pressable>
            {photos.length ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {shown > 0 ? (
                  <Pressable accessibilityRole="button" onPress={() => makeCover(shown)} style={styles.changePhoto}>
                    <Text style={styles.changePhotoText}>Make it the cover</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" accessibilityLabel={`Crop or edit photo ${shown + 1}`} onPress={() => editPhoto(shown)} style={styles.changePhoto}>
                  <Text style={styles.changePhotoText}>Edit</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          {photos.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs} keyboardShouldPersistTaps="handled">
              {photos.map((uri, i) => (
                <View key={uri + i}>
                  <Pressable accessibilityRole="button" accessibilityLabel={i === 0 ? 'Cover photo' : `Photo ${i + 1}`} accessibilityState={{ selected: i === shown }} onPress={() => setShown(i)} style={[styles.thumb, { borderColor: i === shown ? ground.text : 'transparent' }]}>
                    <Image source={{ uri }} contentFit="cover" style={StyleSheet.absoluteFill} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} onPress={() => removePhoto(i)} hitSlop={6} style={styles.thumbX}>
                    <CloseIcon size={11} strokeWidth={2.6} />
                  </Pressable>
                  {i === 0 ? <Text style={[styles.cover, { color: ground.muted }]}>Cover</Text> : null}
                </View>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Add another photo" onPress={addPhoto} style={[styles.thumb, styles.addThumb, { borderColor: ground.line }]}>
                  <PlusIcon size={20} color={ground.text} />
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}

          <View style={styles.body}>
            <Eyebrow>New listing</Eyebrow>
            {/* Shop first, then the title (founder, Nov 24 2026). */}
            <View style={{ gap: 8 }}>
              <Text style={[styles.boxLabel, { color: ground.muted }]}>SHOP</Text>
              {words('Which shop', SHOP_NICHES.map((id) => ({ key: id, label: niches[id].label, color: niches[id].accent })), nicheId, (k) => pickNiche(k as NicheId))}
            </View>
            <Text style={[styles.boxLabel, { color: ground.muted, marginBottom: -8 }]}>WHAT ARE YOU SELLING?</Text>
            <View style={styles.card}>
              <TextInput
                accessibilityLabel="What are you selling?"
                value={title}
                onChangeText={setTitle}
                selectionColor={niche.accent}
                multiline
                numberOfLines={Platform.OS === 'web' ? 1 : undefined}
                style={[styles.title, { color: ground.text }, webInput]}
              />
            </View>

            <View style={styles.boxes}>
              {box('PRICE', price, setPrice, { prefix: '$', flex: 1.4, sub: priceCents !== null ? `You get ${formatPrice(priceCents - feeFor(priceCents))}` : price ? 'Like 24 or 24.50' : 'Niches keeps 5%' })}
              {format === 'physical' ? box('SHIPPING', shipping, setShipping, { prefix: '$', sub: shippingCents === 0 ? 'Free shipping' : undefined }) : null}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.boxLabel, { color: ground.muted }]}>DESCRIPTION</Text>
              <View style={[styles.card, { minHeight: 90 }]}>
                <TextInput
                  accessibilityLabel="Description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={1000}
                  selectionColor={niche.accent}
                  style={[styles.description, { color: ground.text }, webInput]}
                />
              </View>
            </View>

            <View>
              {stacked('Delivery method', words('Delivery method', [{ key: 'physical', label: 'Ships to you' }, { key: 'digital', label: 'Digital download' }], format, (k) => setFormat(k as ListingFormat)))}
              {format === 'physical'
                ? row(
                    'Quantity',
                    <View style={styles.qtyBox}>
                      <TextInput
                        accessibilityLabel="Quantity"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="number-pad"
                        placeholder="Made to order"
                        placeholderTextColor={ground.muted}
                        selectionColor={niche.accent}
                        style={[styles.qtyInput, { color: ground.text }, webInput]}
                      />
                    </View>,
                    'Leave empty if you make each one to order',
                  )
                : null}
              {stacked(
                'Item category',
                <>
                  {words('Item category', [...(CATEGORIES[nicheId] ?? []).map((c) => ({ key: c, label: c })), { key: 'other', label: 'Other' }], kind, (k) => setKind(k === kind ? '' : k))}
                  {kind === 'other' ? (
                    <View style={[styles.card, styles.otherBox]}>
                      <TextInput
                        accessibilityLabel="Your own kind"
                        autoFocus
                        value={other}
                        onChangeText={setOther}
                        maxLength={40}
                        placeholder="Like a bread poster"
                        placeholderTextColor={ground.muted}
                        selectionColor={niche.accent}
                        style={[styles.otherInput, { color: ground.text }, webInput]}
                      />
                    </View>
                  ) : null}
                </>,
                'Optional',
              )}
              {myPosts.length ? (
                <View style={[styles.kind, { borderBottomColor: ground.line }]}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Shop this bar: choose a post" onPress={() => setChoosingPost((o) => !o)} style={styles.rowInner}>
                    <View style={{ flexShrink: 1, gap: 2 }}>
                      <Text style={[styles.rowLabel, { color: ground.text }]}>Shop this bar</Text>
                      <Text style={[styles.rowSub, { color: ground.muted }]}>Shows under one of your posts</Text>
                    </View>
                    {linked ? (
                      <View style={styles.linked}>
                        <View style={[styles.linkedThumb, { backgroundColor: linked.mediaColor ?? niche.field }]}>
                          {postPhoto(linked) ? <Image source={postPhoto(linked)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                        </View>
                        <Text style={[styles.linkText, { color: ground.text }]} numberOfLines={1}>{shortTitle(linked.mediaLabel || linked.caption, 18)}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.linkText, { color: ground.text }]}>Choose a post</Text>
                    )}
                  </Pressable>
                  {choosingPost ? (
                    <View style={{ gap: 6, paddingBottom: 6 }}>
                      {myPosts.slice(0, 6).map((p) => {
                        const on = p.id === linkedPostId;
                        return (
                          <Pressable key={p.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => (setLinkedPostId(on ? undefined : p.id), setChoosingPost(false))} style={[styles.postOption, on && { borderColor: ground.text }]}>
                            <View style={[styles.linkedThumb, { backgroundColor: p.mediaColor ?? niche.field }]}>
                              {postPhoto(p) ? <Image source={postPhoto(p)} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
                            </View>
                            <Text style={[styles.postText, { color: ground.text }]} numberOfLines={2}>{p.caption}</Text>
                            {on ? <CheckIcon size={17} color={ground.text} /> : null}
                          </Pressable>
                        );
                      })}
                      {linked ? (
                        <Pressable accessibilityRole="button" onPress={() => (setLinkedPostId(undefined), setChoosingPost(false))} hitSlop={6}>
                          <Text style={[styles.rowSub, { color: ground.muted, textDecorationLine: 'underline' }]}>No Shop this bar</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: ownWork }} onPress={() => setOwnWork(!ownWork)} style={styles.check}>
              <View style={[styles.checkBox, { borderColor: ownWork ? ground.text : ground.line }, ownWork && { backgroundColor: ground.text }]}>
                {ownWork ? <CheckIcon size={14} strokeWidth={3} color={ground.ground} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.checkLabel, { color: ground.text }]}>{nicheId === 'cooking' ? 'My own work, and not food' : 'This is my own work'}</Text>
                <Text style={[styles.rowSub, { color: ground.muted }]}>
                  {nicheId === 'cooking' ? 'Recipes, cookbooks and kitchen prints are welcome; food can’t be sold.' : 'Not copied, and not AI art passed off as handmade.'}
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* One long List it bar at the bottom (founder, Nov 23 2026). */}
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: ground.ground, borderTopColor: ground.line }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={create}
            style={({ pressed }) => [styles.listIt, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.85 : 1) : 0.3 }]}>
            <Text style={[styles.listItText, { color: ground.ground }]}>{priceCents !== null ? `List it · ${formatPrice(priceCents)}` : 'List it'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <DraftPrompt
        visible={askDraft}
        saved={!!draft}
        title={title}
        photo={photos[0] ? { uri: photos[0] } : seen}
        tag={`${niche.label} shop${priceCents !== null ? ` · ${formatPrice(priceCents)}` : ''}`}
        tint={niche.mid}
        ink={niche.ink}
        onKeep={() => setAskDraft(false)}
        onSave={saveDraft}
        onDelete={dropDraft}
      />
      <PhotoEditor photo={editing?.photo ?? null} title="Listing photo" onCancel={() => setEditing(null)} onDone={editDone} />
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  photo: { height: 330, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  addPhoto: { alignItems: 'center', gap: 8 },
  addPhotoText: { fontSize: 16, fontWeight: '700' },
  overPhoto: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  changePhoto: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center' },
  thumbs: { gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  thumb: { width: 62, height: 62, borderRadius: 12, overflow: 'hidden', borderWidth: 2 },
  addThumb: { borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  thumbX: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cover: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  changePhotoText: { fontSize: 13, fontWeight: '700', color: '#1F1A14' },
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 14 },
  card: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: '#FFFFFF' },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, paddingVertical: 0 },
  boxes: { flexDirection: 'row', gap: 10 },
  numBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF' },
  boxLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  numRow: { flexDirection: 'row', alignItems: 'center' },
  num: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  numInput: { flex: 1, minWidth: 0, paddingVertical: 0 },
  boxSub: { fontSize: 11 },
  description: { fontSize: 15, lineHeight: 21, minHeight: 66, textAlignVertical: 'top', paddingVertical: 0 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, paddingVertical: 6 },
  rowInner: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, lineHeight: 16 },
  qtyBox: { width: 132, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
  qtyInput: { fontSize: 15, paddingVertical: 9, textAlign: 'right' },
  kind: { borderBottomWidth: 1, paddingTop: 12, paddingBottom: 12, gap: 10 },
  words: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 8 },
  word: { paddingBottom: 4, borderBottomWidth: 2.5 },
  wordText: { fontSize: 15 },
  kindHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  otherBox: { paddingVertical: 0, borderRadius: 14 },
  otherInput: { fontSize: 15, paddingVertical: 11 },
  linked: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  linkedThumb: { width: 32, height: 32, borderRadius: 8, overflow: 'hidden' },
  linkText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline', flexShrink: 1 },
  postOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: '#FFFFFF' },
  postText: { flex: 1, fontSize: 14 },
  check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkLabel: { fontSize: 15, fontWeight: '700' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  listIt: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  listItText: { fontSize: 16, fontWeight: '700' },
});
