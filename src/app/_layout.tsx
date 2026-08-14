import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as NativeSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useInitializeSocialLogin } from '@/src/features/social-login';
import { AppSplashScreen } from '@/src/screens/splash-screen';
import { ScreenLoadingOverlay } from '@/src/shared/ui/ScreenLoadingOverlay';

const MINIMUM_SPLASH_DURATION_MS = 1000;

void NativeSplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useInitializeSocialLogin();
  const [hasMinimumSplashDurationElapsed, setHasMinimumSplashDurationElapsed] =
    useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'EliceDXNeolli-Bold': require('@/src/shared/assets/fonts/EliceDXNeolli-Bold.ttf'),
    'EliceDXNeolli-Light': require('@/src/shared/assets/fonts/EliceDXNeolli-Light.ttf'),
    'EliceDXNeolli-Medium': require('@/src/shared/assets/fonts/EliceDXNeolli-Medium.ttf'),
    'Galmuri11-Bold': require('@/src/shared/assets/fonts/Galmuri11-Bold.ttf'),
    MemomentKkukkukk: require('@/src/shared/assets/fonts/MemomentKkukkukk.otf'),
    'Pretendard-SemiBold': require('@/src/shared/assets/fonts/Pretendard-SemiBold.otf'),
  });

  useEffect(() => {
    void NativeSplashScreen.hideAsync();

    const splashTimer = setTimeout(
      () => setHasMinimumSplashDurationElapsed(true),
      MINIMUM_SPLASH_DURATION_MS,
    );

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const hideNavigationBar = () => {
      void NavigationBar.setVisibilityAsync('hidden').catch(() => undefined);
    };

    hideNavigationBar();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hideNavigationBar();
      }
    });

    return () => appStateSubscription.remove();
  }, []);

  if (
    (!fontsLoaded && !fontError) ||
    !hasMinimumSplashDurationElapsed
  ) {
    return <AppSplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <ScreenLoadingOverlay />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
