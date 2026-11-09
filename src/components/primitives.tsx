import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from '@/components/text';

import { CameraIcon, PlayIcon } from '@/components/icons';
import { formatDuration } from '@/lib/format';
import { colors, fonts, TOUCH } from '@/lib/theme';
import type { Post, User } from '@/lib/types';

export function Avatar({ user, size = 34 }: { user: User | undefined; size?: number }) {
  const initial = (user?.displayName || user?.username || '?').trim().charAt(0).toUpperCase();
  if (user?.avatarUri) {
    return (
      <Image
        source={{ uri: user.avatarUri }}
        accessibilityElementsHidden
        importantForAccessibility="no"
        contentFit="cover"
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: user.avatarColor }}
      />
    );
  }
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: user?.avatarColor ?? '#9AA19B', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.41, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

/** A post's photo, or a labeled color block standing in for it when there's no real image yet. */
export function MediaPlaceholder({ post, height, radius = 0, showLabel = true }: { post: Post; height: number; radius?: number; showLabel?: boolean }) {
  const isVideo = post.kind === 'video';
  if (post.imageUri && !isVideo) {
    return (
      <Image
        source={{ uri: post.imageUri }}
        accessibilityLabel={post.mediaLabel ? `Photo: ${post.mediaLabel}` : 'Photo'}
        accessible
        contentFit="cover"
        transition={150}
        style={{ height, borderRadius: radius, backgroundColor: post.mediaColor ?? '#E3E5E1' }}
      />
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${isVideo ? 'Video' : 'Photo'}: ${post.mediaLabel ?? 'untitled'}`}
      style={{ height, borderRadius: radius, backgroundColor: post.mediaColor ?? '#C9CDC6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {!isVideo && showLabel ? <CameraIcon /> : null}
      {showLabel ? (
        <View style={styles.mediaLabel}>
          <Text style={styles.mediaLabelText} numberOfLines={1}>
            {isVideo ? 'Video' : 'Photo'} · {post.mediaLabel}
          </Text>
        </View>
      ) : null}
      {isVideo && post.durationSec ? (
        <View style={showLabel ? styles.duration : styles.durationCorner}>
          {showLabel ? null : <PlayIcon size={9} color="#FFFFFF" />}
          <Text style={styles.durationText}>{formatDuration(post.durationSec)}</Text>
        </View>
      ) : null}
    </View>
  );
}

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  tone?: 'solid' | 'outline' | 'ghost' | 'inverse';
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/** Full-width action button. Presses scale slightly so taps feel physical. */
export function Button({ label, tone = 'solid', color = '#1E6B47', style, textStyle, disabled, ...rest }: ButtonProps) {
  const bg = tone === 'solid' ? color : tone === 'inverse' ? '#FFFFFF' : 'transparent';
  const fg = tone === 'solid' ? '#FFFFFF' : tone === 'inverse' ? color : tone === 'outline' ? colors.textBody : colors.textBody;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        tone === 'outline' ? { borderWidth: 1, borderColor: colors.border } : null,
        style,
      ]}
      {...rest}>
      <Text style={[styles.buttonText, { color: fg }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

/** Headlines in Instrument Serif. Italic for the big niche names and moments like "You're caught up." */
export function DisplayText({ children, size = 38, color = colors.text, italic = false, style }: { children: React.ReactNode; size?: number; color?: string; italic?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <Text accessibilityRole="header" style={[{ fontFamily: italic ? fonts.displayItalic : fonts.display, fontSize: size, lineHeight: size * 1.04, letterSpacing: -size * 0.015, color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  mediaLabel: { position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, maxWidth: '80%' },
  mediaLabelText: { color: colors.text, fontSize: 12, fontWeight: '500' },
  duration: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(20,22,26,0.78)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationCorner: { position: 'absolute', left: 8, top: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(20,22,26,0.78)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  durationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  button: { minHeight: TOUCH + 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
