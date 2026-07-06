import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useInitializeSocialLogin } from '@/src/features/social-login';

export default function RootLayout() {
  useInitializeSocialLogin();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
