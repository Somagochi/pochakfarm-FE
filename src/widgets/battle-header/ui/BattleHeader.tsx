import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BACK_ICON = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const BATTLE_REWARD_BANNER = require('@/src/shared/assets/images/battle/battle-reward-banner.png');
const COIN_REWARD_ICON = require('@/src/shared/assets/images/battle/coin-reward-icon.png');
const EXPERIENCE_REWARD_ICON = require('@/src/shared/assets/images/battle/experience-reward-icon.png');

type BattleHeaderProps = {
  coinReward?: number | string;
  experienceReward?: number | string;
  showRewardBanner?: boolean;
  subtitle?: string;
  title?: string;
};

export function BattleHeader({
  coinReward = 300,
  experienceReward = 328,
  showRewardBanner = true,
  subtitle,
  title = '출전 동물 선택',
}: BattleHeaderProps) {
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
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {showRewardBanner && (
        <View style={styles.rewardBannerContainer}>
          <Image
            accessibilityLabel="대전 보상"
            resizeMode="contain"
            source={BATTLE_REWARD_BANNER}
            style={styles.rewardBanner}
          />
          <View style={styles.rewardList}>
            <View style={styles.rewardItem}>
              <Image source={COIN_REWARD_ICON} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>+{coinReward}코인</Text>
            </View>
            <View style={styles.rewardItem}>
              <Image source={EXPERIENCE_REWARD_ICON} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>+{experienceReward}EXP</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: scaleByDeviceWidth(10),
    alignItems: 'center',
    paddingBottom: scaleByDeviceWidth(23),
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
  subtitle: {
    color: '#9B805D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
    textAlign: 'center',
  },
  rewardBannerContainer: {
    width: scaleByDeviceWidth(292),
    height: scaleByDeviceWidth(34),
    justifyContent: 'center',
  },
  rewardBanner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  rewardList: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingRight: scaleByDeviceWidth(12),
    gap: scaleByDeviceWidth(16),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(2),
  },
  rewardIcon: {
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
  },
  rewardText: {
    color: '#725C43',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  pressed: {
    opacity: 0.8,
  },
});
