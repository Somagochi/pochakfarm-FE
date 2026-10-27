import { Tabs } from 'expo-router';

import { useUserProfile } from '@/src/entities/user';
import { usePreloadFarm } from '@/src/entities/farm';
import { AppSplashScreen } from '@/src/screens/splash-screen';
import { BottomTabBar } from '@/src/widgets/bottom-tab-bar';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

export default function TabLayout() {
  const { clearError, errorMessage, isLoading } = useUserProfile();
  // 소셜 로그인 직후에도 프로필 조회 뒤로 농장 준비가 밀리지 않게 합니다.
  usePreloadFarm('GROUND', true);

  if (isLoading) {
    return <AppSplashScreen />;
  }

  return (
    <>
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        freezeOnBlur: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="farm"
        options={{
          freezeOnBlur: false,
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
