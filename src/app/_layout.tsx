import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as NativeSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useInitializeSocialLogin } from '@/src/features/social-login';
import { AppSplashScreen } from '@/src/screens/splash-screen';

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
  });

  useEffect(() => {
    void NativeSplashScreen.hideAsync();

    const splashTimer = setTimeout(
      () => setHasMinimumSplashDurationElapsed(true),
      MINIMUM_SPLASH_DURATION_MS,
    );

    return () => clearTimeout(splashTimer);
  }, []);

  if (
    (!fontsLoaded && !fontError) ||
    !hasMinimumSplashDurationElapsed
  ) {
    return <AppSplashScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
