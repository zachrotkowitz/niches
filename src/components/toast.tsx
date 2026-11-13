import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastAction = { label: string; onPress: () => void };

const ToastContext = createContext<(message: string, action?: ToastAction) => void>(() => {});

/** Short confirmation messages ("Link copied", "Post archived"), optionally with one button ("Saved · Add to board"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | undefined>(undefined);
  const [n, setN] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string, next?: ToastAction) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    setAction(next);
    setN((x) => x + 1);
    // A toast with a button stays a little longer so there's time to tap it.
    timer.current = setTimeout(() => setMessage(null), next ? 4500 : 2200);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: insets.bottom + 96 }]}>
        {message ? (
          <Animated.View key={n} pointerEvents={action ? 'auto' : 'none'} entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(160)} style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Text style={styles.text}>{message}</Text>
            {action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (timer.current) clearTimeout(timer.current);
                  setMessage(null);
                  action.onPress();
                }}
                hitSlop={8}
                style={styles.action}>
                <Text style={styles.actionText}>{action.label}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#1F1A14', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  text: { color: '#FFFFFF', fontSize: 15, fontWeight: '500', flexShrink: 1 },
  action: { minHeight: 32, justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
});
