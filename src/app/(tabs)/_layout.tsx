import { Tabs } from 'expo-router';

import { useUserProfile } from '@/src/entities/user';
import { AppSplashScreen } from '@/src/screens/splash-screen';
import { BottomTabBar } from '@/src/widgets/bottom-tab-bar';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

export default function TabLayout() {
  const { clearError, errorMessage, isLoading } = useUserProfile();

  if (isLoading) {
    return <AppSplashScreen />;
  }

  return (
    <>
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="farm"
        options={{
          title: '농장',
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: '도감',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: '포착',
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: '대전',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '더보기',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
    <ErrorModal message={errorMessage} onClose={clearError} />
    </>
  );
}
