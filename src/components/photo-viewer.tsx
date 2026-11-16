import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/primitives';
import { Text } from '@/components/text';
import { useAppGround } from '@/lib/store';
import { fonts, TOUCH } from '@/lib/theme';
import type { User } from '@/lib/types';

/**
 * Tap someone's profile picture to see it up close: a large circle on the app
 * background, with their name. Tap anywhere (or Close) to go back. On your own
 * profile there's also "Change photo".
 */
export function PhotoViewer({ user, visible, onClose, onChange }: { user: User; visible: boolean; onClose: () => void; onChange?: () => void }) {
  const ground = useAppGround();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 64, height * 0.5, 420);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={[StyleSheet.absoluteFill, { backgroundColor: ground.ground }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View pointerEvents="box-none" style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.close}>
            <Text style={[styles.closeText, { color: ground.text }]}>Close</Text>
          </Pressable>
        </View>
        <View pointerEvents="box-none" style={styles.center}>
          <Animated.View entering={ZoomIn.springify().damping(18).stiffness(180)} accessibilityRole="image" accessibilityLabel={`${user.displayName}’s profile photo`} style={styles.shadow}>
            <Avatar user={user} size={size} />
          </Animated.View>
          <Text style={[styles.name, { color: ground.text }]}>{user.displayName}</Text>
          <Text style={[styles.handle, { color: ground.muted }]}>{user.username}</Text>
          {onChange ? (
            <Pressable accessibilityRole="button" onPress={onChange} hitSlop={6} style={styles.change}>
              <Text style={[styles.changeText, { color: ground.text }]}>{user.avatarUri ? 'Change photo' : 'Add a photo'}</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  close: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
  closeText: { fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  shadow: { borderRadius: 999, shadowColor: '#1F1A14', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  name: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, marginTop: 24 },
  handle: { fontSize: 15, marginTop: 2 },
  change: { minHeight: TOUCH, justifyContent: 'center', marginTop: 8 },
  changeText: { fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
});
