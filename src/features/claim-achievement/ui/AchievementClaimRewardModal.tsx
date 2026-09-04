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
import { ErrorDialog } from '@/src/shared/ui/ErrorModal';

const COIN_IMAGE = require('@/src/shared/assets/images/farm-status/coin.png');
const DEFAULT_BADGE_IMAGE = require('@/src/shared/assets/images/collection/unregistered-achievement-badge.png');
const ADDITIONAL_REWARD_TITLE = require('@/src/shared/assets/images/collection/additional-reward-title.png');
const BADGE_REWARD_GLOW = require('@/src/shared/assets/images/collection/badge-reward-glow.png');
const REWARD_CONTENT_DEFAULT_TOP_RATIO = 0.25;
const REWARD_CONTENT_BUTTON_MIN_GAP = 30;
const REWARD_BUTTON_BOTTOM = 52;
const REWARD_BUTTON_HEIGHT = 60;
const BADGE_HEIGHT = 114.32;
const MESSAGE_AREA_MARGIN_TOP = 100;
const TITLE_LINE_HEIGHT = 22;
const TITLE_LINE_COUNT = 2;
const DESCRIPTION_MARGIN_TOP = 14;
const DESCRIPTION_LINE_HEIGHT = 17;
const DESCRIPTION_LINE_COUNT = 2;
const ADDITIONAL_REWARD_MARGIN_TOP = 40;
const ADDITIONAL_REWARD_HEIGHT = 24;
const COIN_REWARD_MARGIN_TOP = 40;
const COIN_REWARD_HEIGHT = 22;

type AchievementClaimRewardModalProps = {
  badgeImageUrl?: string;
  coinAmount: number;
  errorMessage?: string | null;
  onClose: () => void;
  onErrorClose?: () => void;
  title: string;
  visible: boolean;
};

export function AchievementClaimRewardModal({
  badgeImageUrl,
  coinAmount,
  errorMessage = null,
  onClose,
  onErrorClose = onClose,
  title,
  visible,
}: AchievementClaimRewardModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const rewardContentHeight = scaleByDeviceWidth(
    BADGE_HEIGHT +
      MESSAGE_AREA_MARGIN_TOP +
      TITLE_LINE_HEIGHT * TITLE_LINE_COUNT +
      DESCRIPTION_MARGIN_TOP +
      DESCRIPTION_LINE_HEIGHT * DESCRIPTION_LINE_COUNT +
      ADDITIONAL_REWARD_MARGIN_TOP +
      ADDITIONAL_REWARD_HEIGHT +
      COIN_REWARD_MARGIN_TOP +
      COIN_REWARD_HEIGHT,
  );
  const rewardButtonTop =
    height -
    insets.bottom -
    scaleByDeviceWidth(REWARD_BUTTON_BOTTOM + REWARD_BUTTON_HEIGHT);
  const rewardContentTop = Math.min(
    height * REWARD_CONTENT_DEFAULT_TOP_RATIO,
    rewardButtonTop -
      scaleByDeviceWidth(REWARD_CONTENT_BUTTON_MIN_GAP) -
      rewardContentHeight,
  );

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
          style={[styles.rewardContent, { paddingTop: rewardContentTop }]}
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
            {
              bottom:
                insets.bottom + scaleByDeviceWidth(REWARD_BUTTON_BOTTOM),
            },
            pressed && styles.pressed,
          ]}
        >
          <Image
            contentFit="fill"
            source={REWARD_BUTTON_IMAGE}
            style={styles.rewardButtonImage}
          />
        </Pressable>
        <ErrorDialog message={errorMessage} onClose={onErrorClose} />
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
    height: scaleByDeviceWidth(BADGE_HEIGHT),
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
    marginTop: scaleByDeviceWidth(MESSAGE_AREA_MARGIN_TOP),
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
    height: scaleByDeviceWidth(ADDITIONAL_REWARD_HEIGHT),
    marginTop: scaleByDeviceWidth(ADDITIONAL_REWARD_MARGIN_TOP),
  },
  coinReward: {
    marginTop: scaleByDeviceWidth(COIN_REWARD_MARGIN_TOP),
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
    height: scaleByDeviceWidth(REWARD_BUTTON_HEIGHT),
  },
  rewardButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
