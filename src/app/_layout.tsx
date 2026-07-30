import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useInitializeSocialLogin } from '@/src/features/social-login';

export default function RootLayout() {
  useInitializeSocialLogin();
  const [fontsLoaded, fontError] = useFonts({
    'EliceDXNeolli-Bold': require('@/src/shared/assets/fonts/EliceDXNeolli-Bold.ttf'),
    'EliceDXNeolli-Light': require('@/src/shared/assets/fonts/EliceDXNeolli-Light.ttf'),
    'EliceDXNeolli-Medium': require('@/src/shared/assets/fonts/EliceDXNeolli-Medium.ttf'),
    'Galmuri11-Bold': require('@/src/shared/assets/fonts/Galmuri11-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
