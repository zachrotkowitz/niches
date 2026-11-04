import { SchibstedGrotesk_700Bold, SchibstedGrotesk_800ExtraBold, useFonts } from '@expo-google-fonts/schibsted-grotesk';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';

import { StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ground, text: colors.text } };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ThemeProvider value={theme}>
            <ToastProvider>
              <StatusBar style="dark" />
              <RootStack />
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { state } = useStore();
  const [fontsLoaded, fontError] = useFonts({ SchibstedGrotesk_700Bold, SchibstedGrotesk_800ExtraBold });
  const ready = state.hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!state.me;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="post/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="connections/[id]" />
        <Stack.Screen name="plans/index" />
        <Stack.Screen name="plans/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="plans/[id]" />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="shop/cart" />
        <Stack.Screen name="shop/orders" />
        <Stack.Screen name="shop/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="creators/apply" />
        <Stack.Screen name="creators/studio" />
        <Stack.Screen name="creators/memberships" />
        <Stack.Screen name="settings/colors" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
