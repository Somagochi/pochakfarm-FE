import { Image } from 'expo-image';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { REWARD_BUTTON_IMAGE } from '@/src/shared/assets/images/coupon-result/rewardButtonImage';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const COIN_IMAGE = require('@/src/shared/assets/images/farm-status/coin.png');
const DEFAULT_BADGE_IMAGE = require('@/src/shared/assets/images/collection/unregistered-achievement-badge.png');
const ADDITIONAL_REWARD_TITLE = require('@/src/shared/assets/images/collection/additional-reward-title.png');
const BADGE_REWARD_GLOW = require('@/src/shared/assets/images/collection/badge-reward-glow.png');

type AchievementClaimRewardModalProps = {
  badgeImageUrl?: string;
  coinAmount: number;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function AchievementClaimRewardModal({
  badgeImageUrl,
  coinAmount,
  onClose,
  title,
  visible,
}: AchievementClaimRewardModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="보상 화면 닫기"
          accessibilityRole="button"
          hitSlop={scaleByDeviceWidth(8)}
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            { top: insets.top + scaleByDeviceWidth(20) },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.closeLine, styles.closeLineForward]} />
          <View style={[styles.closeLine, styles.closeLineBackward]} />
        </Pressable>

        <View
          style={[styles.rewardContent, { paddingTop: height * 0.25 }]}
        >
          <View style={styles.badgeAnchor}>
            <Image
              accessible={false}
              contentFit="contain"
              source={BADGE_REWARD_GLOW}
              style={styles.badgeGlow}
            />
            <Image
              accessibilityLabel={`${title} 뱃지`}
              contentFit="contain"
              source={
                badgeImageUrl ? { uri: badgeImageUrl } : DEFAULT_BADGE_IMAGE
              }
              style={styles.badgeImage}
            />
          </View>

          <View style={styles.messageArea}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.title}>뱃지를 수령했어요!</Text>
            <Text style={styles.description}>
              뱃지와 함께 {coinAmount}코인을{`\n`}지급해드렸어요!
            </Text>
          </View>

          <Image
            contentFit="contain"
            source={ADDITIONAL_REWARD_TITLE}
            style={styles.additionalRewardTitle}
          />

          <View style={styles.coinReward}>
            <Image source={COIN_IMAGE} style={styles.coinImage} />
            <Text style={styles.coinText}>코인 {coinAmount}개</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="보상 확인"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.rewardButton,
            { bottom: insets.bottom + scaleByDeviceWidth(52) },
            pressed && styles.pressed,
          ]}
        >
          <Image
            contentFit="fill"
            source={REWARD_BUTTON_IMAGE}
            style={styles.rewardButtonImage}
          />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.91)',
  },
  closeButton: {
    position: 'absolute',
    right: scaleByDeviceWidth(20),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(24),
    zIndex: 1,
  },
  closeLine: {
    position: 'absolute',
    top: scaleByDeviceWidth(11),
    left: scaleByDeviceWidth(1),
    width: scaleByDeviceWidth(22),
    height: scaleByDeviceWidth(1.5),
    borderRadius: scaleByDeviceWidth(1),
    backgroundColor: '#FFFFFF',
  },
  closeLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineBackward: {
    transform: [{ rotate: '-45deg' }],
  },
  rewardContent: {
    alignItems: 'center',
  },
  badgeAnchor: {
    width: scaleByDeviceWidth(114.32),
    height: scaleByDeviceWidth(114.32),
  },
  badgeGlow: {
    position: 'absolute',
    top: scaleByDeviceWidth(-64.33),
    left: scaleByDeviceWidth(-64.33),
    width: scaleByDeviceWidth(242.98),
    height: scaleByDeviceWidth(242.98),
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  messageArea: {
    marginTop: scaleByDeviceWidth(100),
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
    textAlign: 'center',
  },
  description: {
    marginTop: scaleByDeviceWidth(14),
    color: '#96938E',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
    textAlign: 'center',
  },
  additionalRewardTitle: {
    width: scaleByDeviceWidth(275),
    height: scaleByDeviceWidth(24),
    marginTop: scaleByDeviceWidth(40),
  },
  coinReward: {
    marginTop: scaleByDeviceWidth(40),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleByDeviceWidth(10),
  },
  coinImage: {
    width: scaleByDeviceWidth(18),
    height: scaleByDeviceWidth(18),
  },
  coinText: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(22),
  },
  rewardButton: {
    position: 'absolute',
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  rewardButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
