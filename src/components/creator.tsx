import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '@/components/text';

import { CheckIcon, LockIcon, StarIcon, VerifiedIcon } from '@/components/icons';
import { Button } from '@/components/primitives';
import { Sheet } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { formatPrice } from '@/lib/shop';
import { useNiches, useStore } from '@/lib/store';
import { colors, TOUCH } from '@/lib/theme';
import type { Post, User } from '@/lib/types';

/** Username (or name) with a verified check and/or Premium marker after it. */
export function NameWithBadges({ user, name, style, size = 15 }: { user: User | undefined; name?: string; style?: StyleProp<TextStyle>; size?: number }) {
  return (
    <View style={styles.nameRow}>
      <Text style={[{ fontSize: size, fontWeight: '600', color: colors.text, flexShrink: 1 }, style]} numberOfLines={1}>
        {name ?? user?.username ?? 'unknown'}
      </Text>
      <Badges user={user} size={size} />
    </View>
  );
}

export function Badges({ user, size = 15 }: { user: User | undefined; size?: number }) {
  if (!user?.verified && !user?.membership) return null;
  return (
    <View style={styles.badges}>
      {user.verified ? (
        <View accessible accessibilityLabel="Verified">
          <VerifiedIcon size={Math.round(size * 1.05)} />
        </View>
      ) : null}
      {user.membership ? (
        <View accessible accessibilityLabel="Premium creator" style={styles.premium}>
          <StarIcon size={Math.round(size * 0.6)} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Pretend payment sheet for a creator's membership or a single members-only
 * post. Nothing is charged in the demo.
 */
export function JoinSheet({ creator, post, visible, onClose }: { creator: User; post?: Post; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const { actions } = useStore();
  const niches = useNiches();
  const [choice, setChoice] = useState<'member' | 'unlock' | null>(null);
  const m = creator.membership;
  const accent = niches[post?.niche ?? 'cooking'].accent;
  if (!m) return null;

  const close = () => {
    setChoice(null);
    onClose();
  };
  const confirm = () => {
    if (choice === 'member') {
      actions.joinMembership(creator.id);
      toast(`You’re a member of ${creator.username} (demo)`);
    } else if (choice === 'unlock' && post) {
      actions.unlockPost(post.id);
      toast('Post unlocked (demo)');
    }
    close();
  };

  if (choice) {
    const price = choice === 'member' ? `${formatPrice(m.priceCents)} a month` : formatPrice(post?.unlockCents ?? 0);
    return (
      <Sheet visible={visible} onClose={close} title={choice === 'member' ? `Join ${creator.username}` : 'Unlock this post'}>
        <View style={styles.confirm}>
          <Text style={styles.confirmPrice}>{price}</Text>
          <Text style={styles.confirmBody}>
            {choice === 'member' ? 'Renews monthly. Cancel anytime from Profile → Memberships.' : 'One-time purchase. Yours to keep.'} Paid through the App Store.
          </Text>
          <View style={styles.demo}>
            <Text style={styles.demoText}>Demo: no money will be charged.</Text>
          </View>
          <Button label={choice === 'member' ? 'Join' : 'Unlock'} color={accent} onPress={confirm} />
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={close} title={`Support ${creator.displayName}`}>
      <Pressable accessibilityRole="button" onPress={() => setChoice('member')} style={[styles.option, { borderColor: accent }]}>
        <View style={styles.optionHead}>
          <Text style={styles.optionTitle}>Membership</Text>
          <Text style={styles.optionPrice}>{formatPrice(m.priceCents)}/mo</Text>
        </View>
        <Text style={styles.optionSub}>{m.tagline}</Text>
        {m.perks.map((p) => (
          <View key={p} style={styles.perk}>
            <CheckIcon size={14} color={accent} strokeWidth={3} />
            <Text style={styles.perkText}>{p}</Text>
          </View>
        ))}
      </Pressable>
      {post?.unlockCents ? (
        <Pressable accessibilityRole="button" onPress={() => setChoice('unlock')} style={styles.option}>
          <View style={styles.optionHead}>
            <Text style={styles.optionTitle}>Just this post</Text>
            <Text style={styles.optionPrice}>{formatPrice(post.unlockCents)}</Text>
          </View>
          <Text style={styles.optionSub}>One-time unlock. No subscription.</Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}

/** Shown in place of a members-only post's content for people without access. */
export function LockedPanel({ post, author, compact = false }: { post: Post; author: User | undefined; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const niches = useNiches();
  const niche = niches[post.niche];
  const m = author?.membership;
  return (
    <View style={[styles.locked, { backgroundColor: niche.field }, compact ? { padding: 14 } : null]}>
      <View style={styles.lockedHead}>
        <View style={[styles.lockCircle, { backgroundColor: niche.accent }]}>
          <LockIcon size={16} color="#FFFFFF" />
        </View>
        <Text style={[styles.lockedTitle, { color: niche.ink }]}>Members only</Text>
      </View>
      <Text style={[styles.lockedBody, { color: niche.inkSoft }]}>
        {m ? `Join ${author?.username} for ${formatPrice(m.priceCents)} a month${post.unlockCents ? `, or unlock just this post for ${formatPrice(post.unlockCents)}` : ''}.` : 'This post is for members.'}
      </Text>
      {m && author ? (
        <>
          <Button label={post.unlockCents ? 'See options' : `Join for ${formatPrice(m.priceCents)}/mo`} color={niche.accent} onPress={() => setOpen(true)} />
          <JoinSheet creator={author} post={post} visible={open} onClose={() => setOpen(false)} />
        </>
      ) : null}
    </View>
  );
}

/** Membership card on a premium creator's profile. */
export function MembershipCard({ creator, accent, field, ink }: { creator: User; accent: string; field: string; ink: string }) {
  const router = useRouter();
  const { state, actions } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const m = creator.membership;
  if (!m) return null;
  const isMe = creator.id === state.me?.id;
  const member = !!state.memberships[creator.id];

  return (
    <View style={[styles.card, { backgroundColor: field }]}>
      <View style={styles.optionHead}>
        <Text style={[styles.cardTitle, { color: ink }]}>{isMe ? 'Your membership' : member ? 'You’re a member' : 'Membership'}</Text>
        <Text style={[styles.cardPrice, { color: ink }]}>{formatPrice(m.priceCents)}/mo</Text>
      </View>
      <Text style={[styles.cardTagline, { color: ink }]}>{m.tagline}</Text>
      {m.perks.map((p) => (
        <View key={p} style={styles.perk}>
          <CheckIcon size={14} color={accent} strokeWidth={3} />
          <Text style={[styles.perkText, { color: ink }]}>{p}</Text>
        </View>
      ))}
      {isMe ? (
        <Button label="Open Creator studio" color={accent} onPress={() => router.push('/creators/studio')} style={{ marginTop: 6 }} />
      ) : member ? (
        <Button
          label="Cancel membership"
          tone="inverse"
          color={ink}
          style={{ marginTop: 6 }}
          onPress={() => {
            actions.cancelMembership(creator.id);
            toast('Membership cancelled');
          }}
        />
      ) : (
        <>
          <Button label={`Join for ${formatPrice(m.priceCents)}/mo`} color={accent} onPress={() => setOpen(true)} style={{ marginTop: 6 }} />
          <JoinSheet creator={creator} visible={open} onClose={() => setOpen(false)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0, flexShrink: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  premium: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#14161A', alignItems: 'center', justifyContent: 'center' },
  confirm: { paddingHorizontal: 8, gap: 12, paddingBottom: 4 },
  confirmPrice: { fontSize: 28, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  confirmBody: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  demo: { alignSelf: 'flex-start', backgroundColor: colors.note, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  demoText: { fontSize: 13, fontWeight: '700', color: '#5C4A00' },
  option: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 14, gap: 6, marginBottom: 10 },
  optionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  optionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  optionPrice: { fontSize: 17, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  optionSub: { fontSize: 14, color: colors.textSecondary },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 14, color: colors.textBody, flexShrink: 1 },
  locked: { marginHorizontal: 20, marginTop: 4, padding: 18, borderRadius: 18, gap: 10 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontSize: 17, fontWeight: '800' },
  lockedBody: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 18, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardPrice: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cardTagline: { fontSize: 15, fontWeight: '600' },
  linkRow: { minHeight: TOUCH },
});
