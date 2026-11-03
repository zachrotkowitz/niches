import { SchibstedGrotesk_700Bold, SchibstedGrotesk_800ExtraBold, useFonts } from '@expo-google-fonts/schibsted-grotesk';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ground, text: colors.text } };

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="dark" />
          <RootStack />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
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
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
