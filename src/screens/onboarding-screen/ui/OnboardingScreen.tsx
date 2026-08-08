import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { completeOnboarding } from '@/src/features/complete-onboarding';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const NEXT_BUTTON_IMAGE = require('@/src/shared/assets/images/onboarding/next-button.png');
const START_BUTTON_IMAGE = require('@/src/shared/assets/images/onboarding/start-button.png');
const SKIP_BUTTON_IMAGE = require('@/src/shared/assets/images/onboarding/skip-button.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const ONBOARDING_TEXT_IMAGES = [
  require('@/src/shared/assets/images/onboarding/text-1.png'),
  require('@/src/shared/assets/images/onboarding/text-2.png'),
  require('@/src/shared/assets/images/onboarding/text-3.png'),
] as const;
const ONBOARDING_VISUAL_IMAGES = [
  require('@/src/shared/assets/images/onboarding/visual-1.png'),
  require('@/src/shared/assets/images/onboarding/visual-2.png'),
  require('@/src/shared/assets/images/onboarding/visual-3.png'),
] as const;

const LAST_PAGE_INDEX = 2;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);

  const finishOnboarding = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  const handlePrimaryPress = () => {
    if (pageIndex === LAST_PAGE_INDEX) {
      void finishOnboarding();
      return;
    }

    setPageIndex((currentPageIndex) => currentPageIndex + 1);
  };

  const isLastPage = pageIndex === LAST_PAGE_INDEX;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {pageIndex > 0 && (
        <Pressable
          accessibilityLabel="이전 온보딩 페이지로 돌아가기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() =>
            setPageIndex((currentPageIndex) => currentPageIndex - 1)
          }
          style={({ pressed }) => [
            styles.backButton,
            { top: insets.top + scaleByDeviceWidth(19) },
            pressed && styles.pressed,
          ]}
        >
          <Image source={BACK_ICON_IMAGE} style={styles.backIcon} />
        </Pressable>
      )}

      <View style={styles.content}>
        <Image
          accessibilityLabel={`${pageIndex + 1}번째 온보딩 안내`}
          resizeMode="contain"
          source={ONBOARDING_TEXT_IMAGES[pageIndex]}
          style={styles.textImage}
        />
        <Image
          accessibilityLabel={`${pageIndex + 1}번째 온보딩 예시`}
          resizeMode="contain"
          source={ONBOARDING_VISUAL_IMAGES[pageIndex]}
          style={styles.visualImage}
        />
        <View
          accessibilityLabel={`총 3단계 중 ${pageIndex + 1}단계`}
          style={styles.progressBar}
        >
          {ONBOARDING_VISUAL_IMAGES.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.progressDot,
                dotIndex === pageIndex && styles.activeProgressDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.bottomActions}>
        <Pressable
          accessibilityLabel={isLastPage ? '시작하기' : '다음으로'}
          accessibilityRole="button"
          onPress={handlePrimaryPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Image
            resizeMode="contain"
            source={isLastPage ? START_BUTTON_IMAGE : NEXT_BUTTON_IMAGE}
            style={styles.primaryButtonImage}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="건너뛰기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(8)}
          onPress={() => void finishOnboarding()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Image
            resizeMode="contain"
            source={SKIP_BUTTON_IMAGE}
            style={styles.skipButtonImage}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5EB',
  },
  content: {
    alignItems: 'center',
  },
  textImage: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(186),
    marginTop: scaleByDeviceWidth(10),
  },
  visualImage: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(280),
    marginTop: scaleByDeviceWidth(24),
  },
  progressBar: {
    width: scaleByDeviceWidth(54),
    height: scaleByDeviceWidth(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleByDeviceWidth(24),
  },
  progressDot: {
    width: scaleByDeviceWidth(10),
    height: scaleByDeviceWidth(10),
    borderRadius: scaleByDeviceWidth(5),
    backgroundColor: '#E9DFC8',
  },
  activeProgressDot: {
    backgroundColor: '#F5C84C',
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    zIndex: 1,
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  backIcon: {
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: scaleByDeviceWidth(63),
    paddingBottom: scaleByDeviceWidth(16),
  },
  primaryButtonImage: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  skipButtonImage: {
    width: scaleByDeviceWidth(160),
    height: scaleByDeviceWidth(54),
  },
  pressed: {
    opacity: 0.8,
  },
});
