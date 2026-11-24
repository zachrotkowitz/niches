import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckoutSheet } from '@/components/checkout-sheet';
import { Stars, StarInput } from '@/components/diary';
import { Eyebrow } from '@/components/discover-parts';
import { BagIcon, BookmarkIcon, ChevronLeftIcon, MoreIcon } from '@/components/icons';
import { Avatar, DisplayText, MediaPlaceholder } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { ListingGrid } from '@/components/shop';
import { SurfaceProvider } from '@/components/surface';
import { Text } from '@/components/text';
import { useToast, type ToastAction } from '@/components/toast';
import { listingPhotos } from '@/lib/demo-photos';
import { timeAgo } from '@/lib/format';
import { SEED_USERS } from '@/lib/seed';
import { averageRating, FEE_RATE, feeFor, formatPrice, type CartItem } from '@/lib/shop';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { fonts, groundSurface, TOUCH } from '@/lib/theme';

const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

/**
 * A listing (founder, Nov 20 2026; Shopify's product page with Etsy's trust
 * lines): a big photo, the title, stars · reviews · sold, the seller with
 * their shop rating, what you get, reviews, more from the seller, and one
 * bar at the bottom: price · Add to cart · Buy now (a one-sheet checkout).
 */
export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const { state, usersById, actions } = useStore();
  const niches = useNiches();
  const ground = groundSurface(useAppGround());
  const [menu, setMenu] = useState(false);
  const [buying, setBuying] = useState<CartItem[] | null>(null);
  const [allReviews, setAllReviews] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myText, setMyText] = useState('');
  const [writing, setWriting] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const { width } = useWindowDimensions();

  const listing = state.listings.find((l) => l.id === id);
  const meId = state.me?.id;
  const isMine = listing?.sellerId === meId;
  // Count a view for the seller's dashboard when someone else opens it.
  useEffect(() => {
    if (listing && !isMine) actions.viewListing(listing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: ground.ground, paddingTop: insets.top + 60, paddingHorizontal: 20, gap: 14 }}>
        <DisplayText size={28} color={ground.text}>This listing isn’t available anymore.</DisplayText>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.linkHit}>
          <Text style={[styles.link, { color: ground.text }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const niche = niches[listing.niche];

  // Messages about this niche come in its dark color (founder, Nov 24 2026).

  const toast = (message: string, action?: ToastAction) => showToast(message, action, niche.ink);
  const photos = listingPhotos(listing);
  const seller = usersById[listing.sellerId];
  const saved = !!state.savedListings[listing.id];
  const inCart = state.cart.find((c) => c.listingId === listing.id);
  const soldOut = listing.stock === 0;
  const post = listing.linkedPostId ? state.posts.find((p) => p.id === listing.linkedPostId) : undefined;
  const more = state.listings.filter((l) => l.sellerId === listing.sellerId && l.id !== listing.id);
  const reviews = state.reviews.filter((r) => r.listingId === listing.id).sort((a, b) => b.createdAt - a.createdAt);
  const avg = averageRating(reviews);
  const sellerListings = state.listings.filter((l) => l.sellerId === listing.sellerId);
  const sellerReviews = state.reviews.filter((r) => sellerListings.some((l) => l.id === r.listingId));
  const sellerSales = sellerListings.reduce((n, l) => n + l.sold, 0);
  const bought = !!meId && state.orders.some((o) => o.buyerId === meId && o.lines.some((l) => l.listingId === listing.id));
  const mine = reviews.find((r) => r.authorId === meId);
  const reviewsOn = !listing.reviewsOff;
  const shown = allReviews ? reviews : reviews.slice(0, 3);
  const chips = [
    listing.category,
    listing.format === 'digital' ? 'Download right after you pay' : listing.shippingCents ? `${formatPrice(listing.shippingCents)} shipping` : 'Free shipping',
    listing.format === 'physical' ? (listing.stock === undefined ? 'Made to order' : soldOut ? 'Sold out' : `${listing.stock} left`) : 'Yours to keep',
  ].filter(Boolean); // Kind is optional (founder, Nov 24 2026).

  const addToCart = () => {
    actions.setCart([...state.cart.filter((c) => c.listingId !== listing.id), { listingId: listing.id, qty: (inCart?.qty ?? 0) + 1 }]);
    toast('Added to your cart', { label: 'View cart', onPress: () => router.push('/shop/cart') });
  };
  const postReview = () => {
    if (!meId || !myRating) return;
    actions.reviewListing(listing.id, meId, myRating, myText);
    setWriting(false);
    toast(mine ? 'Review updated' : 'Thanks for the review');
  };

  return (
    <SurfaceProvider value={ground}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ground.ground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: listing.mediaColor }]}>
            {photos.length > 1 ? (
              // More than one photo: swipe through them, with dots (founder, Nov 24 2026).
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                onScroll={Platform.OS === 'web' ? (e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width)) : undefined}
                scrollEventThrottle={64}>
                {photos.map((ph, i) => (
                  <View key={i} accessible accessibilityRole="image" accessibilityLabel={`Photo ${i + 1} of ${photos.length}: ${listing.mediaLabel}`} style={{ width, height: '100%' }}>
                    <Image source={ph} contentFit="cover" style={StyleSheet.absoluteFill} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View accessible accessibilityRole="image" accessibilityLabel={`Photo: ${listing.mediaLabel}`} style={StyleSheet.absoluteFill}>
                {photos[0] ? <Image source={photos[0]} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
              </View>
            )}
            {photos.length > 1 ? (
              <View style={styles.dots} pointerEvents="none">
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex ? styles.dotOn : null]} />
                ))}
              </View>
            ) : null}
          </View>
          {/* Round buttons float over the photo. */}
          <View style={[styles.floatRow, { top: insets.top + 6 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.round}>
              <ChevronLeftIcon size={20} color={ground.text} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${state.cart.reduce((n, c) => n + c.qty, 0)} items`} onPress={() => router.push('/shop/cart')} style={styles.round}>
                <BagIcon size={19} color={ground.text} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Listing options" onPress={() => setMenu(true)} style={styles.round}>
                <MoreIcon size={18} color={ground.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.body}>
            <Eyebrow>{niche.label} · {listing.format === 'digital' ? 'Digital download' : 'Ships to you'}</Eyebrow>
            <Text accessibilityRole="header" style={[styles.title, { color: ground.text }]}>{listing.title}</Text>
            {/* Stars, reviews and sold: buyers see the sold count (founder, Nov 20 2026). */}
            <View style={styles.trust}>
              {reviewsOn && reviews.length ? (
                <>
                  <Stars rating={avg} size={15} color={niche.accent} />
                  <Text style={[styles.trustText, { color: ground.text, fontWeight: '700' }]}>{avg.toFixed(1)}</Text>
                  <Text style={[styles.trustText, { color: ground.muted }]}>· {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} · {listing.sold} sold</Text>
                </>
              ) : (
                <Text style={[styles.trustText, { color: ground.muted }]}>{listing.sold} sold</Text>
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Seller: ${seller?.displayName}. Visit shop`}
              onPress={() => (isMine ? router.push('/shop/dashboard') : router.push({ pathname: '/user/[id]', params: { id: listing.sellerId, tab: 'shop' } }))}
              style={[styles.seller, { borderColor: ground.line }]}>
              <Avatar user={seller} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: ground.text }]}>{isMine ? 'Your listing' : seller?.username}</Text>
                <Text style={[styles.sellerSub, { color: ground.muted }]}>
                  {sellerReviews.length ? `★ ${averageRating(sellerReviews).toFixed(1)} shop rating · ` : ''}
                  {sellerSales} sales
                </Text>
              </View>
              <Text style={[styles.link, { color: ground.text }]}>{isMine ? 'Your shop' : 'Visit shop'}</Text>
            </Pressable>

            <Text style={[styles.description, { color: ground.text }]}>{listing.description}</Text>
            <View style={styles.chips}>
              {chips.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={[styles.chipText, { color: ground.text }]}>{c}</Text>
                </View>
              ))}
            </View>

            {post ? (
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })} style={styles.fromPost}>
                <View style={{ width: 56, borderRadius: 10, overflow: 'hidden' }}>
                  <MediaPlaceholder post={post} height={56} showLabel={false} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.fromLabel, { color: ground.muted }]}>FROM THE POST</Text>
                  <Text style={[styles.fromText, { color: ground.text }]} numberOfLines={2}>{post.caption}</Text>
                </View>
              </Pressable>
            ) : null}

            {isMine ? (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, { color: ground.text }]}>You earn {formatPrice(listing.priceCents - feeFor(listing.priceCents))} per sale</Text>
                <Text style={[styles.cardBody, { color: ground.muted }]}>Niches keeps {Math.round(FEE_RATE * 100)}% ({formatPrice(feeFor(listing.priceCents))}). Buyers pay no extra fees.</Text>
                <View style={[styles.switchRow, { borderTopColor: ground.line }]}>
                  <Text style={[styles.switchLabel, { color: ground.text }]}>Reviews</Text>
                  <Switch
                    accessibilityLabel="Allow reviews on this listing"
                    value={reviewsOn}
                    onValueChange={(on) => (actions.setListingReviews(listing.id, !on), toast(on ? 'Reviews on' : 'Reviews hidden on this listing'))}
                    trackColor={{ true: niche.accent, false: '#D8D2C4' }}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const buyer = SEED_USERS[Math.floor(Math.random() * SEED_USERS.length)];
                    actions.simulateSale(listing, buyer.id);
                    toast(`${buyer.username} bought it (demo). See Your shop.`);
                  }}
                  style={styles.linkHit}>
                  <Text style={[styles.link, { color: ground.text }]}>Demo: simulate a sale</Text>
                </Pressable>
              </View>
            ) : null}

            {reviewsOn ? (
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHead}>
                  <Text style={[styles.section, { color: ground.text }]}>Reviews</Text>
                  {reviews.length > 3 ? (
                    <Pressable accessibilityRole="button" onPress={() => setAllReviews((v) => !v)} hitSlop={8}>
                      <Text style={[styles.link, { color: ground.text }]}>{allReviews ? 'Show fewer' : `See all ${reviews.length}`}</Text>
                    </Pressable>
                  ) : null}
                </View>
                {!reviews.length ? <Text style={[styles.cardBody, { color: ground.muted, marginTop: 4 }]}>No reviews yet.</Text> : null}
                {shown.map((r) => {
                  const who = usersById[r.authorId];
                  return (
                    <View key={r.id} style={[styles.review, { borderBottomColor: ground.line }]}>
                      <View style={styles.reviewHead}>
                        <Avatar user={who} size={26} />
                        <Text style={[styles.reviewWho, { color: ground.text }]}>{r.authorId === meId ? 'You' : who?.username}</Text>
                        <Text style={[styles.reviewWhen, { color: ground.muted }]}>· {timeAgo(r.createdAt)}</Text>
                        <View style={{ marginLeft: 'auto' }}>
                          <Stars rating={r.rating} size={13} color={niche.accent} />
                        </View>
                      </View>
                      {r.text ? <Text style={[styles.reviewText, { color: ground.text }]}>“{r.text}”</Text> : null}
                      {r.reply ? (
                        <View style={[styles.reply, { borderLeftColor: ground.line }]}>
                          <Text style={[styles.replyWho, { color: ground.muted }]}>Reply from {isMine ? 'you' : seller?.username}</Text>
                          <Text style={[styles.replyText, { color: ground.text }]}>{r.reply.text}</Text>
                        </View>
                      ) : isMine ? (
                        replyFor === r.id ? (
                          <View style={[styles.writeBox, { marginTop: 6 }]}>
                            <TextInput accessibilityLabel="Your reply" value={replyText} onChangeText={setReplyText} autoFocus multiline selectionColor={ground.text} style={[styles.writeInput, { color: ground.text }, webInput]} />
                            <Pressable
                              accessibilityRole="button"
                              disabled={!replyText.trim()}
                              onPress={() => (actions.replyToReview(r.id, replyText.trim()), setReplyFor(null), setReplyText(''), toast('Reply posted'))}
                              style={{ opacity: replyText.trim() ? 1 : 0.4 }}>
                              <Text style={[styles.link, { color: ground.text }]}>Post</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable accessibilityRole="button" onPress={() => setReplyFor(r.id)} style={styles.linkHit}>
                            <Text style={[styles.link, { color: ground.muted }]}>Reply</Text>
                          </Pressable>
                        )
                      ) : null}
                    </View>
                  );
                })}
                {/* Only people who bought it can review it. */}
                {bought && !isMine && (!mine || writing) ? (
                  <View style={[styles.card, { marginTop: 12 }]}>
                    <Text style={[styles.cardTitle, { color: ground.text }]}>{mine ? 'Change your review' : 'You bought this. How was it?'}</Text>
                    <StarInput value={myRating} onChange={setMyRating} color={niche.accent} size={34} />
                    {myRating ? (
                      <>
                        <View style={[styles.writeBox, { backgroundColor: '#F6F3EC' }]}>
                          <TextInput accessibilityLabel="Your review" value={myText} onChangeText={setMyText} multiline selectionColor={ground.text} style={[styles.writeInput, { color: ground.text }, webInput]} />
                        </View>
                        <Pressable accessibilityRole="button" onPress={postReview} style={[styles.post, { backgroundColor: ground.text }]}>
                          <Text style={[styles.postText, { color: ground.ground }]}>Post review</Text>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                ) : bought && mine && !isMine ? (
                  <Pressable accessibilityRole="button" onPress={() => (setMyRating(mine.rating), setMyText(mine.text ?? ''), setWriting(true))} style={styles.linkHit}>
                    <Text style={[styles.link, { color: ground.text }]}>Edit your review</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          {more.length ? (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.section, { color: ground.text, paddingHorizontal: 20 }]}>More from {isMine ? 'your shop' : seller?.username}</Text>
              <ListingGrid listings={more} />
            </View>
          ) : null}
        </ScrollView>

        {isMine ? null : (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: ground.ground, borderTopColor: ground.line }]}>
            <View>
              <Text style={[styles.barPrice, { color: ground.text }]}>{formatPrice(listing.priceCents)}</Text>
              <Text style={[styles.barNote, { color: ground.muted }]}>No fees for you</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Saved' : 'Save'}
              accessibilityState={{ selected: saved }}
              onPress={() => actions.toggleSavedListing(listing.id)}
              style={[styles.saveBtn, { borderColor: ground.text }, saved ? { backgroundColor: niche.accent, borderColor: niche.accent } : null]}>
              <BookmarkIcon size={18} filled={saved} color={saved ? '#FFFFFF' : ground.text} />
            </Pressable>
            {soldOut ? (
              <View style={[styles.buy, { backgroundColor: ground.line }]}>
                <Text style={[styles.buyText, { color: ground.muted }]}>Sold out</Text>
              </View>
            ) : (
              <>
                {listing.format === 'digital' && inCart ? null : (
                  <Pressable accessibilityRole="button" onPress={addToCart} style={[styles.addBtn, { borderColor: ground.text }]}>
                    <Text style={[styles.addText, { color: ground.text }]}>Add to cart</Text>
                  </Pressable>
                )}
                <Pressable accessibilityRole="button" onPress={() => setBuying([{ listingId: listing.id, qty: 1 }])} style={[styles.buy, { backgroundColor: ground.text }]}>
                  <Text style={[styles.buyText, { color: ground.ground }]}>Buy now</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <CheckoutSheet
          visible={!!buying}
          items={buying ?? []}
          onClose={() => setBuying(null)}
          onPlaced={(orders) => {
            setBuying(null);
            if (orders[0]) router.push({ pathname: '/shop/order/[id]', params: { id: orders[0].id, fresh: '1' } });
          }}
        />
        <Sheet
          visible={menu}
          onClose={() => setMenu(false)}
          items={
            isMine
              ? [
                  {
                    label: 'Delete listing',
                    destructive: true,
                    detail: 'Removes it from the shop. Past orders stay in Your orders.',
                    onPress: () => {
                      setMenu(false);
                      actions.deleteListing(listing.id);
                      toast('Listing deleted');
                      goBack();
                    },
                  },
                ]
              : [
                  { label: saved ? 'Remove from saved' : 'Save', onPress: () => { setMenu(false); actions.toggleSavedListing(listing.id); toast(saved ? 'Removed from saved' : 'Saved'); } },
                  { label: 'Report listing', destructive: true, detail: 'Food for sale, stolen work, scams or anything else that breaks the rules.', onPress: () => { setMenu(false); toast('Thanks. We’ll review this listing.'); } },
                ]
          }
        />
      </KeyboardAvoidingView>
    </SurfaceProvider>
  );
}

const styles = StyleSheet.create({
  hero: { height: 380, overflow: 'hidden' },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 18, backgroundColor: '#FFFFFF' },
  floatRow: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 37 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  trustText: { fontSize: 14 },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth * 2, borderBottomWidth: StyleSheet.hairlineWidth * 2, marginTop: 4 },
  sellerName: { fontSize: 15, fontWeight: '700' },
  sellerSub: { fontSize: 12, marginTop: 1 },
  description: { fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 12, fontWeight: '600' },
  fromPost: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: '#FFFFFF' },
  fromLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  fromText: { fontSize: 14, lineHeight: 19 },
  card: { padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardBody: { fontSize: 14, lineHeight: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  section: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  review: { paddingVertical: 12, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewWho: { fontSize: 13, fontWeight: '700' },
  reviewWhen: { fontSize: 12 },
  reviewText: { fontFamily: fonts.displayItalic, fontSize: 18, lineHeight: 24 },
  reply: { marginTop: 2, paddingLeft: 12, borderLeftWidth: 2, gap: 2 },
  replyWho: { fontSize: 12, fontWeight: '700' },
  replyText: { fontSize: 14, lineHeight: 19 },
  writeBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#FFFFFF' },
  writeInput: { flex: 1, fontSize: 15, minHeight: 40, paddingVertical: 4, textAlignVertical: 'top' },
  post: { minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  postText: { fontSize: 15, fontWeight: '700' },
  linkHit: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  barPrice: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32 },
  barNote: { fontSize: 11 },
  saveBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addBtn: { minHeight: 46, paddingHorizontal: 14, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 14, fontWeight: '700' },
  buy: { minHeight: 46, paddingHorizontal: 20, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  buyText: { fontSize: 15, fontWeight: '700' },
});
