import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow } from '@/components/discover-parts';
import { CameraIcon, CheckIcon, ChevronLeftIcon, CloseIcon, LockIcon, TextIcon } from '@/components/icons';
import { DisplayText } from '@/components/primitives';
import { SurfaceProvider } from '@/components/surface';
import { TAB_BAR_SPACE } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { UnderlineTabs, useSlidingLine } from '@/components/underline-tabs';
import { postPhoto } from '@/lib/demo-photos';
import { diaryWords } from '@/lib/diary';
import { shortTitle } from '@/lib/format';
import { goalRule, weekNumber, weekStrip } from '@/lib/goals';
import { pickPhoto, takePhoto, type PickedPhoto } from '@/lib/photos';
import { isoDay } from '@/lib/plans';
import { useAppGround, useNiches, useStore } from '@/lib/store';
import { setTabBarHidden } from '@/lib/tab-events';
import { BODY_FONTS, fonts, groundSurface, NICHE_ORDER, TOUCH, type Niche, type NicheId } from '@/lib/theme';
import type { Post, PostKind } from '@/lib/types';

type Kind = 'post' | 'progress' | 'question';

// Motion for the Post tab (founder, Nov 2026: "more dynamic, less static").
// Pages slide in from the side they come from; sections that appear or go
// away fade and the rest glide into place.
const ease = Easing.out(Easing.cubic);
const pageIn = (from: 'left' | 'right') =>
  (from === 'right' ? FadeInRight : FadeInLeft)
    .duration(320)
    .easing(ease)
    .withInitialValues({ opacity: 0, transform: [{ translateX: from === 'right' ? 56 : -56 }] })
    .reduceMotion(ReduceMotion.System);
const glide = LinearTransition.duration(240).easing(ease).reduceMotion(ReduceMotion.System);
// A short wait lets the rows below glide out of the way before the new section fades in.
const appear = FadeInDown.delay(170).duration(260).easing(ease).reduceMotion(ReduceMotion.System);
const vanish = FadeOut.duration(140).reduceMotion(ReduceMotion.System);

// Shown behind a photo while it loads.
const LOADING_TINT = '#E3E5E1';

/** What was just shared, for the "Shared with Cooking." screen. */
type Posted = { id: string; kind: Kind; niche: NicheId; goalId?: string; goalLabel?: string; membersOnly: boolean };

/**
 * The Post tab (founder, Nov 2026): option A "Studio" for writing a post (the
 * cream look of Discover and Saved, a big serif caption, quiet tabs, plain
 * rows) and option C's celebration once it's shared, in the niche's color.
 *
 * It starts on a photo step like Instagram's (founder, Nov 16 2026: "option 1,
 * the lighter version"): tapping + opens the phone's own photo picker straight
 * away, the photo shows big with Next, and "Just text" skips it. The tab bar
 * tucks away on that step. With a development build this becomes a grid of
 * your recent photos inside Niches (expo-media-library); see CLAUDE.md.
 */
export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, actions } = useStore();
  const NICHES = useNiches();
  const ground = useAppGround();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const [kind, setKind] = useState<Kind>('post');
  const [caption, setCaption] = useState('');
  const [goal, setGoal] = useState('');
  // The goal a progress post belongs to; null means "just name it" (free text).
  const [goalId, setGoalId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [picking, setPicking] = useState(false);
  const [posted, setPosted] = useState<Posted | null>(null);
  const [membersOnly, setMembersOnly] = useState(false);
  // Photo first, then the words.
  const [step, setStep] = useState<'photo' | 'write'>('photo');
  // True when you've come back to the photo step from writing, so it slides in from the left.
  const [cameBack, setCameBack] = useState(false);
  const focused = useIsFocused();
  const autoOpened = useRef(false);
  // Post to the niche you're in, if it's open for posting.
  const [nicheId, setNicheId] = useState<NicheId>(NICHES[state.niche].open ? state.niche : 'cooking');

  const choosePhoto = async (from: 'roll' | 'camera' = 'roll') => {
    setPicking(true);
    try {
      const picked = await (from === 'camera' ? takePhoto() : pickPhoto());
      if (picked) setPhoto(picked);
    } finally {
      setPicking(false);
    }
  };

  // Tapping + goes straight to your photos, once each time you open the tab.
  // (Browsers only open a file picker after a tap, so the web build waits for one.)
  useEffect(() => {
    if (!focused) {
      autoOpened.current = false;
      return;
    }
    if (autoOpened.current || step !== 'photo' || photo || picking || posted) return;
    autoOpened.current = true;
    if (Platform.OS !== 'web') void choosePhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);
  // The tab bar steps aside on the photo step, like Instagram.
  useEffect(() => {
    setTabBarHidden(focused && step === 'photo' && !posted);
    return () => setTabBarHidden(false);
  }, [focused, step, posted]);

  // The Post tab stays open in the background, so follow the niche you switch to on Home.
  useEffect(() => {
    if (NICHES[state.niche].open && !posted) setNicheId(state.niche);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.niche, NICHES]);
  // Opening from a goal's "Progress post" button preselects it (and its niche).
  useEffect(() => {
    if (!params.goalId) return;
    const g = state.goals.find((x) => x.id === params.goalId);
    if (g && NICHES[g.niche].open) setNicheId(g.niche);
    setKind('progress');
    setGoalId(params.goalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.goalId]);

  const niche = NICHES[nicheId];
  // The colored line under the niche you're posting to slides between niches.
  const nicheLine = useSlidingLine(nicheId, niche.accent);
  const needsPhoto = kind !== 'question';
  const myGoals = state.goals.filter((g) => g.userId === state.me?.id && g.niche === nicheId && !g.doneAt);
  const pickedGoal = goalId ? myGoals.find((g) => g.id === goalId) : undefined;
  // Wait for a photo that's still being prepared, so it isn't left off the post.
  const ready = !picking && caption.trim().length > 0 && (kind !== 'progress' || !!pickedGoal || goal.trim().length > 0);

  const share = () => {
    if (!ready || !state.me) return;
    const postKind: PostKind = kind === 'question' || !photo ? 'text' : 'photo';
    const premium = membersOnly && !!state.me.membership;
    const id = actions.createPost({
      authorId: state.me.id,
      niche: nicheId,
      kind: postKind,
      caption: caption.trim(),
      mediaColor: postKind === 'photo' ? LOADING_TINT : undefined,
      imageUri: postKind === 'photo' ? photo?.uri : undefined,
      imageAspect: postKind === 'photo' && photo ? photo.height / photo.width : undefined,
      mediaLabel: postKind === 'photo' ? shortTitle(caption.trim()) : undefined,
      // Progress labels say "week 4", never the numbers: those stay private on the goal.
      progressLabel: kind === 'progress' ? (pickedGoal ? `${pickedGoal.title}, week ${weekNumber(pickedGoal)}` : goal.trim()) : undefined,
      goalId: kind === 'progress' && pickedGoal ? pickedGoal.id : undefined,
      premium: premium ? true : undefined,
    });
    actions.setNiche(nicheId);
    // A soft tap to say it went through (founder, Nov 2026).
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setPosted({ id, kind, niche: nicheId, goalId: kind === 'progress' ? pickedGoal?.id : undefined, goalLabel: kind === 'progress' && !pickedGoal ? goal.trim() : undefined, membersOnly: premium });
  };

  const reset = () => {
    setCaption('');
    setGoal('');
    setGoalId(null);
    setPhoto(null);
    setPosted(null);
    setMembersOnly(false);
    setKind('post');
    setStep('photo');
    setCameBack(false);
    if (params.goalId) router.setParams({ goalId: undefined });
  };

  if (posted) return <PostedScreen posted={posted} onDone={reset} />;
  if (step === 'photo') {
    return (
      <PhotoStep
        photo={photo}
        picking={picking}
        entering={cameBack ? pageIn('left') : FadeIn.duration(240).reduceMotion(ReduceMotion.System)}
        onPick={choosePhoto}
        onNext={() => setStep('write')}
        onText={() => {
          setPhoto(null);
          setStep('write');
        }}
        // Once you've written something, the corner button goes back to it instead of throwing it away.
        hasDraft={caption.trim().length > 0}
        onBack={() => setStep('write')}
        onClose={() => {
          reset();
          router.navigate('/');
        }}
      />
    );
  }

  const surface = groundSurface(ground);
  const placeholder =
    kind === 'question' ? `Ask the ${niche.label} niche anything…` : kind === 'progress' ? 'How did it go?' : nicheId === 'photography' ? 'What did you shoot?' : 'What did you make?';

  return (
    <SurfaceProvider value={surface}>
      <Animated.View entering={pageIn('right')} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: TAB_BAR_SPACE }} keyboardShouldPersistTaps="handled">
          <View style={[styles.masthead, { borderBottomColor: ground.text }]}>
            <DisplayText size={42} color={ground.text}>New post</DisplayText>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready }}
              disabled={!ready}
              onPress={share}
              style={({ pressed }) => [styles.share, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.8 : 1) : 0.3 }]}>
              <Text style={[styles.shareText, { color: ground.ground }]}>Share</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 6 }}>
            <UnderlineTabs
              label="Post type"
              inset={10}
              value={kind}
              onChange={(k) => {
                // Coming back to Photo shows the same big photo screen you started on (founder, Nov 2026).
                if (k === 'post' && kind !== 'post') {
                  setCameBack(true);
                  setStep('photo');
                }
                setKind(k as Kind);
              }}
              items={[
                { key: 'post', label: 'Photo' },
                { key: 'progress', label: 'Progress' },
                { key: 'question', label: 'Question' },
              ]}
            />
          </View>

          {needsPhoto ? (
            photo ? (
              <Animated.View key="photo" entering={appear} exiting={vanish} layout={glide} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} accessibilityLabel="Your photo" contentFit="cover" style={[styles.photo, { aspectRatio: 1 / Math.min(1.25, Math.max(0.8, photo.height / photo.width)), backgroundColor: LOADING_TINT }]} />
                <View style={styles.photoButtons}>
                  <Pressable accessibilityRole="button" onPress={() => setPhoto(null)} style={styles.photoChip}>
                    <Text style={[styles.photoChipText, { color: ground.text }]}>Remove</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => choosePhoto()} style={[styles.photoChip, { flexDirection: 'row', gap: 6 }]}>
                    <CameraIcon size={15} color={ground.text} />
                    <Text style={[styles.photoChipText, { color: ground.text }]}>Change</Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Animated.View key="add" entering={appear} exiting={vanish} layout={glide}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: picking }}
                disabled={picking}
                onPress={() => choosePhoto()}
                style={({ pressed }) => [styles.addRow, { borderColor: ground.line, opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.addRowIcon, { backgroundColor: ground.text }]}>
                  <CameraIcon size={19} color={ground.ground} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[styles.choiceTitle, { color: ground.text }]}>{picking ? 'Opening your photos…' : 'Add a photo'}</Text>
                  <Text style={[styles.choiceSub, { color: ground.muted }]}>From your camera roll</Text>
                </View>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <ChevronLeftIcon size={18} color={ground.muted} />
                </View>
              </Pressable>
              </Animated.View>
            )
          ) : null}

          {/* Type straight in, in the serif, like a headline. */}
          <Animated.View layout={glide}>
          <TextInput
            accessibilityLabel={kind === 'question' ? 'Your question' : 'Caption'}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2000}
            placeholder={placeholder}
            placeholderTextColor={ground.muted}
            selectionColor={ground.text}
            style={[styles.caption, { color: ground.text, fontFamily: caption ? fonts.display : fonts.displayItalic }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
          />
          </Animated.View>

          <Animated.View layout={glide} style={[styles.rows, { borderTopColor: ground.line }]}>
            {kind === 'progress' ? (
              <Animated.View entering={appear} exiting={vanish} style={[styles.row, { borderBottomColor: ground.line, alignItems: 'stretch', flexDirection: 'column', paddingVertical: 12, gap: 4 }]}>
                <Eyebrow>Counts toward</Eyebrow>
                {myGoals.map((g) => {
                  const on = g.id === goalId;
                  const cells = weekStrip(g, 4);
                  return (
                    <Pressable key={g.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setGoalId(g.id)} style={styles.choice}>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={[styles.choiceTitle, { color: ground.text }]}>{g.title}</Text>
                        <Text style={[styles.choiceSub, { color: ground.muted }]}>{goalRule(g)} · week {weekNumber(g)}</Text>
                      </View>
                      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
                        {cells.map((c) => (
                          <View key={c.key} style={[styles.dot, c.met || c.rest ? { backgroundColor: niche.accent } : { borderWidth: 1.5, borderColor: ground.muted }]} />
                        ))}
                      </View>
                      <Check on={on} color={ground.text} empty={ground.muted} />
                    </Pressable>
                  );
                })}
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: goalId === null }} onPress={() => setGoalId(null)} style={styles.choice}>
                  <Text style={[styles.choiceTitle, { color: ground.text, flex: 1 }]}>{myGoals.length ? 'Something else' : 'Name what you’re working on'}</Text>
                  <Check on={goalId === null} color={ground.text} empty={ground.muted} />
                </Pressable>
                {goalId === null ? (
                  <TextInput
                    accessibilityLabel="What you're working on"
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="e.g. Fresh pasta, week 4"
                    placeholderTextColor={ground.muted}
                    maxLength={60}
                    selectionColor={ground.text}
                    style={[styles.goalInput, { color: ground.text, borderColor: ground.line }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
                  />
                ) : null}
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/goals/new', params: { niche: nicheId } })} style={styles.link}>
                  <Text style={[styles.linkText, { color: ground.text }]}>+ Set a new goal</Text>
                </Pressable>
              </Animated.View>
            ) : null}

            <Animated.View layout={glide} style={[styles.row, { borderBottomColor: ground.line, flexDirection: 'column', alignItems: 'stretch', paddingVertical: 12, gap: 6 }]}>
              <Eyebrow>Posting to</Eyebrow>
              <View accessibilityRole="radiogroup" style={styles.niches}>
                {NICHE_ORDER.map((id) => {
                  const n = NICHES[id];
                  const on = id === nicheId;
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, disabled: !n.open }}
                      accessibilityLabel={n.open ? n.label : `${n.label}, opening soon`}
                      disabled={!n.open}
                      onPress={() => {
                        setNicheId(id);
                        setGoalId(null);
                      }}
                      onLayout={nicheLine.onItemLayout(id)}
                      style={styles.nicheWord}>
                      <Text style={[styles.nicheText, { color: on ? ground.text : ground.muted, fontWeight: on ? '700' : '500', opacity: n.open ? 1 : 0.5 }]}>{n.open ? n.label : `${n.label} · soon`}</Text>
                      <View style={styles.nicheLine} />
                    </Pressable>
                  );
                })}
                {nicheLine.line}
              </View>
            </Animated.View>

            {state.me?.membership ? (
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: membersOnly }} onPress={() => setMembersOnly(!membersOnly)} style={[styles.row, { borderBottomColor: ground.line }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.choiceTitle, { color: ground.text }]}>Members only</Text>
                  <Text style={[styles.choiceSub, { color: ground.muted }]}>Only your members can open it. Everyone else sees a locked preview.</Text>
                </View>
                <View style={[styles.switchTrack, membersOnly ? { backgroundColor: ground.text } : null]}>
                  <View style={[styles.switchKnob, membersOnly ? { transform: [{ translateX: 18 }] } : null]} />
                </View>
              </Pressable>
            ) : null}
          </Animated.View>

          <Animated.View layout={glide}>
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/plans/new', params: { niche: nicheId } })} style={styles.planLink}>
            <Text style={[styles.planText, { color: ground.muted }]}>
              Planning something instead? <Text style={{ color: ground.text, fontWeight: '700', textDecorationLine: 'underline' }}>Make a plan</Text>
            </Text>
          </Pressable>
          <Text style={[styles.hint, { color: ground.muted, marginHorizontal: 20, marginTop: 6 }]}>
            Only you will see how many people liked or saved it.
          </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      </Animated.View>
    </SurfaceProvider>
  );
}

function Check({ on, color, empty }: { on: boolean; color: string; empty: string }) {
  return (
    <View style={[styles.check, on ? { backgroundColor: color, borderColor: color } : { borderColor: empty }]}>
      {on ? <CheckIcon size={14} strokeWidth={2.8} /> : null}
    </View>
  );
}

/**
 * Step one, Instagram-style (founder's option 1, lighter version): the photo
 * big at the top, Next to write the caption. The phone's own picker opens as
 * the tab opens; Camera roll reopens it, the camera button takes a new one.
 */
function PhotoStep({ entering, photo, picking, hasDraft, onPick, onNext, onText, onBack, onClose }: { entering: ComponentProps<typeof Animated.View>['entering']; photo: PickedPhoto | null; picking: boolean; hasDraft: boolean; onPick: (from?: 'roll' | 'camera') => void; onNext: () => void; onText: () => void; onBack: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const ground = useAppGround();
  const { width, height } = useWindowDimensions();
  const w = Math.min(width, 640);
  // Square-ish, like the feed (between 4:5 and 5:4), but never more than about half the screen.
  const ratio = photo ? Math.min(1.25, Math.max(0.8, photo.height / photo.width)) : 1;
  const previewH = Math.min(w * ratio, height * 0.56);
  const ready = !!photo && !picking;

  return (
    <SurfaceProvider value={groundSurface(ground)}>
      <Animated.View entering={entering} style={{ flex: 1, paddingTop: insets.top + 4, alignItems: 'center' }}>
        <View style={[styles.stepBar, { width: w }]}>
          {hasDraft ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back to your post" onPress={onBack} style={styles.stepIcon}>
              <ChevronLeftIcon color={ground.text} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.stepIcon}>
              <CloseIcon color={ground.text} />
            </Pressable>
          )}
          <DisplayText size={24} color={ground.text}>New post</DisplayText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={onNext}
            style={({ pressed }) => [styles.share, { backgroundColor: ground.text, opacity: ready ? (pressed ? 0.8 : 1) : 0.3 }]}>
            <Text style={[styles.shareText, { color: ground.ground }]}>Next</Text>
          </Pressable>
        </View>

        {photo ? (
          <Animated.View key={photo.uri} entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}>
            <Image source={{ uri: photo.uri }} accessibilityLabel="Your photo" contentFit="cover" style={{ width: w, height: previewH, backgroundColor: LOADING_TINT }} />
          </Animated.View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: picking }}
            disabled={picking}
            onPress={() => onPick()}
            style={[styles.emptyPreview, { width: w, height: previewH, backgroundColor: ground.line }]}>
            <Text style={[styles.emptyTitle, { color: ground.text }]}>{picking ? 'Opening your photos…' : 'Pick a photo'}</Text>
            {picking ? null : <Text style={[styles.choiceSub, { color: ground.muted }]}>Tap here, or take one with the camera.</Text>}
          </Pressable>
        )}

        <View style={[styles.stepRow, { width: w }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose from your camera roll" disabled={picking} onPress={() => onPick()} style={styles.rollButton}>
            <Text style={[styles.rollText, { color: ground.text }]}>Camera roll</Text>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
              <ChevronLeftIcon size={16} color={ground.text} />
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable accessibilityRole="button" onPress={onText} style={({ pressed }) => [styles.textChip, { borderColor: ground.line, opacity: pressed ? 0.7 : 1 }]}>
              <TextIcon color={ground.text} />
              <Text style={[styles.photoChipText, { color: ground.text }]}>Just text</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Take a photo" disabled={picking} onPress={() => onPick('camera')} style={({ pressed }) => [styles.camButton, { backgroundColor: ground.text, opacity: pressed ? 0.8 : 1 }]}>
              <CameraIcon size={17} color={ground.ground} />
            </Pressable>
          </View>
        </View>
        {photo ? <Text style={[styles.hint, { color: ground.muted, marginTop: 8, paddingHorizontal: 32 }]}>Happy with it? Tap Next to write about it.</Text> : null}
      </Animated.View>
    </SurfaceProvider>
  );
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Option C's moment after sharing: the niche's color, a white check,
 * "Shared with Cooking.", what it counted toward, and your week in that niche.
 * Rewards are about your own progress, never likes or other people's numbers.
 */
function PostedScreen({ posted, onDone }: { posted: Posted; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useStore();
  const niche: Niche = useNiches()[posted.niche];
  const words = diaryWords(posted.niche);
  const post = state.posts.find((p) => p.id === posted.id);
  const goal = posted.goalId ? state.goals.find((g) => g.id === posted.goalId) : undefined;
  const question = posted.kind === 'question';

  // This week (Monday to Sunday): your posts in this niche, by day.
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const mine = state.posts.filter((p) => p.authorId === state.me?.id && p.niche === posted.niche && !p.archived && p.createdAt >= monday.getTime());
  const byDay: (Post | undefined)[] = DAY_LETTERS.map((_, i) => {
    const start = monday.getTime() + i * 86400000;
    return mine.filter((p) => p.createdAt >= start && p.createdAt < start + 86400000).sort((a, b) => b.createdAt - a.createdAt)[0];
  });
  const made = mine.filter((p) => p.kind !== 'text').length;
  const todayIndex = (new Date().getDay() + 6) % 7;

  const title = question ? `Asked in ${niche.label}.` : `Shared with ${niche.label}.`;
  const lines: string[] = [];
  if (posted.kind === 'progress' && goal) lines.push(`Nice work. Week ${weekNumber(goal, isoDay())} of ${goal.title} is checked off.`);
  else if (posted.kind === 'progress' && posted.goalLabel) lines.push(`Progress on ${posted.goalLabel}, shared.`);
  else if (question) lines.push('We’ll let you know when someone answers.');
  else lines.push(`It’s at the top of the ${niche.label} feed.`);
  if (posted.membersOnly) lines.push('Only your members can open it. Everyone else sees a locked preview.');

  const toFeed = () => {
    onDone();
    router.navigate('/');
  };

  return (
    <View style={[styles.posted, { backgroundColor: niche.mid, paddingTop: insets.top + 70 }]}>
      <Animated.View entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)} style={[styles.bigCheck, { shadowColor: niche.ink }]}>
        <CheckIcon size={40} color={niche.ink} strokeWidth={2.6} />
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(320).delay(80).reduceMotion(ReduceMotion.System)} style={{ alignItems: 'center', gap: 10 }}>
        <Text accessibilityRole="header" style={[styles.postedTitle, { color: niche.ink }]}>{title}</Text>
        {lines.map((l) => (
          <Text key={l} style={[styles.postedLine, { color: niche.ink }]}>{l}</Text>
        ))}
      </Animated.View>

      {!question ? (
        <Animated.View entering={FadeInDown.duration(320).delay(180).reduceMotion(ReduceMotion.System)} style={styles.weekCard}>
          <View style={styles.weekHead}>
            <Eyebrow style={{ color: niche.inkSoft }}>Your week in {niche.label}</Eyebrow>
            <Text style={[styles.weekCount, { color: niche.ink }]}>
              {made} {made === 1 ? words.thing : words.things}
            </Text>
          </View>
          <View style={styles.weekRow}>
            {byDay.map((p, i) => {
              const photo = p ? postPhoto(p) : undefined;
              return (
                <View key={i} style={styles.dayCell}>
                  <View style={[styles.dayTile, p ? { backgroundColor: p.mediaColor ?? '#FFFFFF' } : { backgroundColor: 'rgba(255,255,255,0.4)' }, i === todayIndex ? { borderWidth: 2, borderColor: niche.ink } : null]}>
                    {photo ? <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} /> : p ? <Text style={[styles.dayText, { color: niche.ink }]}>Aa</Text> : null}
                  </View>
                  <Text style={[styles.dayLetter, { color: niche.inkSoft }]}>{DAY_LETTERS[i]}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.duration(320).delay(260).reduceMotion(ReduceMotion.System)} style={{ alignSelf: 'stretch', gap: 4, marginTop: 22 }}>
        <Pressable accessibilityRole="button" onPress={toFeed} style={({ pressed }) => [styles.primary, { backgroundColor: niche.ink, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.primaryText}>See it in the feed</Text>
        </Pressable>
        {!question && post ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onDone();
              router.push({ pathname: '/log/new', params: { postId: posted.id } });
            }}
            style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: niche.ink }]}>Also add it to your {words.diary}</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => { onDone(); router.push({ pathname: '/post/[id]', params: { id: posted.id } }); }} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: niche.ink }]}>See your question</Text>
          </Pressable>
        )}
        {posted.membersOnly ? (
          <View style={styles.lockNote}>
            <LockIcon size={12} color={niche.inkSoft} />
            <Text style={{ fontSize: 12, color: niche.inkSoft }}>Members only</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  masthead: { marginHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  share: { minHeight: 40, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareText: { fontSize: 15, fontWeight: '700' },
  photoCard: { marginHorizontal: 20, marginTop: 18, borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#1F1A14', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  photo: { width: '100%' },
  photoButtons: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', gap: 8 },
  photoChip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  photoChipText: { fontSize: 13, fontWeight: '700' },
  addRow: { marginHorizontal: 20, marginTop: 14, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  addRowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Photo step
  stepBar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6, paddingRight: 14, marginBottom: 6 },
  stepIcon: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  emptyPreview: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { fontFamily: fonts.displayItalic, fontSize: 34, lineHeight: 38 },
  stepRow: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  rollButton: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  rollText: { fontSize: 15, fontWeight: '700' },
  textChip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  camButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  caption: { marginHorizontal: 20, marginTop: 18, minHeight: 90, fontSize: 28, lineHeight: 32, paddingVertical: 4, textAlignVertical: 'top' },
  rows: { marginHorizontal: 20, marginTop: 12, borderTopWidth: 1 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1 },
  choice: { minHeight: TOUCH + 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceTitle: { fontSize: 15, fontWeight: '700' },
  choiceSub: { fontSize: 13, lineHeight: 18 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  goalInput: { minHeight: TOUCH + 2, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: BODY_FONTS['500'], backgroundColor: '#FFFFFF' },
  link: { minHeight: TOUCH, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontSize: 14, fontWeight: '700' },
  niches: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 },
  nicheWord: { minHeight: 40, justifyContent: 'center' },
  nicheText: { fontSize: 15 },
  nicheLine: { height: 2.5, borderRadius: 2, marginTop: 4 },
  switchTrack: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#D5D0C6', padding: 3 },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  planLink: { minHeight: TOUCH, justifyContent: 'center', marginHorizontal: 20, marginTop: 10 },
  planText: { fontSize: 14 },
  hint: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  // Posted
  posted: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  bigCheck: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  postedTitle: { fontFamily: fonts.displayItalic, fontSize: 52, lineHeight: 54, textAlign: 'center' },
  postedLine: { fontSize: 16, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  weekCard: { alignSelf: 'stretch', marginTop: 26, padding: 16, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.55)', gap: 12 },
  weekHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  weekCount: { fontFamily: fonts.display, fontSize: 22 },
  weekRow: { flexDirection: 'row', gap: 6 },
  dayCell: { flex: 1, alignItems: 'center', gap: 6 },
  dayTile: { width: '100%', height: 62, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.display, fontSize: 18 },
  dayLetter: { fontSize: 11, fontWeight: '700' },
  primary: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondary: { minHeight: TOUCH, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  lockNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
