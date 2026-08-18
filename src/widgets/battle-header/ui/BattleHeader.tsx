import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BACK_ICON = require('@/src/shared/assets/images/coupon-registration/back-icon.png');

export function BattleHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(12)}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Image source={BACK_ICON} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.title}>출전 동물 선택</Text>
      </View>
      <Text style={styles.description}>
        관장 라인업을 확인하고 대결 순서를 정해보세요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleByDeviceWidth(10),
    paddingBottom: scaleByDeviceWidth(16),
    gap: scaleByDeviceWidth(8),
  },
  titleRow: {
    width: '100%',
    height: scaleByDeviceWidth(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
  },
  backIcon: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#352D25',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(28),
    textAlign: 'center',
  },
  description: {
    color: '#75695D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(18),
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
