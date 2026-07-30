import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/src/features/complete-onboarding';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

export function OnboardingScreen() {
  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>포착팜에 오신 것을 환영해요</Text>
        <Text style={styles.description}>
          온보딩 화면은 준비 중이에요.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="로그인으로 계속"
        accessibilityRole="button"
        onPress={handleContinue}
        style={({ pressed }) => [
          styles.continueButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.continueButtonText}>로그인으로 계속</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: scaleByDeviceWidth(32),
    backgroundColor: '#FFF9F0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#3D291C',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(26),
    lineHeight: scaleByDeviceWidth(36),
    textAlign: 'center',
  },
  description: {
    marginTop: scaleByDeviceWidth(12),
    color: '#8B795F',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
  },
  continueButton: {
    height: scaleByDeviceWidth(56),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scaleByDeviceWidth(2),
    borderColor: '#294A1A',
    borderRadius: scaleByDeviceWidth(4),
    backgroundColor: '#365D20',
  },
  continueButtonText: {
    color: '#FFF9F0',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(18),
  },
  pressed: {
    opacity: 0.8,
  },
});
