import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
  SchibstedGrotesk_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/schibsted-grotesk';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/toast';

import { StoreProvider, useAppGround, useStore } from '@/lib/store';
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
  const ground = useAppGround();
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
  });
  const ready = state.hydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = !!state.me;
  return (
    // Everything that isn't a niche feed sits on the app's own background (cream by
    // default), the same whichever niche you were last in. Niche screens (Home, a
    // post, a goal) paint their own niche color on top.
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: signedIn ? ground.ground : colors.ground } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="post/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="discover/[niche]" />
        <Stack.Screen name="boards/[id]" />
        <Stack.Screen name="boards/add" options={{ presentation: 'modal' }} />
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
        <Stack.Screen name="log/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log/[id]" />
        <Stack.Screen name="favorites/[niche]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals/index" />
        <Stack.Screen name="goals/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="goals/[id]" />
        <Stack.Screen name="recap/[niche]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="settings/colors" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
