import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CreatureTier } from '@/src/entities/creature';
import { useCompleteCoupon } from '@/src/features/complete-coupon';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const REWARD_GUIDE_IMAGE = require('@/src/shared/assets/images/coupon-result/reward-guide.png');
const REWARD_CARD_IMAGE = require('@/src/shared/assets/images/coupon-result/reward-card.png');
const COMPLETE_BUTTON_IMAGE = require('@/src/shared/assets/images/coupon-result/complete-button.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const CARD_FRONT_PLACEHOLDER_IMAGE = require('@/src/shared/assets/images/farm/card-image-placeholder.png');
const CARD_REWARD_PAWS_IMAGE = require('@/src/shared/assets/images/coupon-result/card-reward-paws.png');
const BADGE_REWARD_IMAGE = require('@/src/shared/assets/images/coupon-result/badge-reward.png');
const BADGE_REWARD_ICON_IMAGE = require('@/src/shared/assets/images/coupon-result/badge-reward-icon.png');
const BADGE_REWARD_PAWS_IMAGE = require('@/src/shared/assets/images/coupon-result/badge-reward-paws.png');
const COIN_REWARD_ICON_IMAGE = require('@/src/shared/assets/images/coupon-result/coin-reward-icon.png');
const COIN_REWARD_PAWS_IMAGE = require('@/src/shared/assets/images/coupon-result/coin-reward-paws.png');
const NEXT_BUTTON_IMAGE = require('@/src/shared/assets/images/coupon-result/next-button.png');

function isCreatureTier(value: string | undefined): value is CreatureTier {
  return value !== undefined && ['C', 'B', 'A', 'S', 'SS', 'SSS'].includes(value);
}

export function CouponResultScreen() {
  const insets = useSafeAreaInsets();
  const { completeCoupon, isLoading } = useCompleteCoupon();
  const [isRewardResultVisible, setIsRewardResultVisible] = useState(false);
  const [hasCardImageError, setHasCardImageError] = useState(false);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [isCoinRewardVisible, setIsCoinRewardVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { animalImageKey, cardImageUrl, couponCode, tier } =
    useLocalSearchParams<{
      animalImageKey?: string;
      cardImageUrl?: string;
      couponCode?: string;
      tier?: string;
    }>();
  const rewardTier = isCreatureTier(tier) ? tier : 'S';

  async function handleCompletePress() {
    if (isLoading) {
      return;
    }

    if (!couponCode || !animalImageKey) {
      setErrorMessage('쿠폰 보상 정보가 올바르지 않습니다.');
      return;
    }

    const completeErrorMessage = await completeCoupon(
      couponCode,
      animalImageKey,
    );

    if (completeErrorMessage) {
      setErrorMessage(completeErrorMessage);
      return;
    }

    setIsRewardResultVisible(true);
  }

  function handleRewardButtonPress() {
    if (isCoinRewardVisible) {
      router.replace('/more');
      return;
    }

    if (!isRewardClaimed) {
      setIsRewardClaimed(true);
      return;
    }

    setIsCoinRewardVisible(true);
  }

  const cardFrontImageSource =
    cardImageUrl && !hasCardImageError
      ? { uri: cardImageUrl }
      : CARD_FRONT_PLACEHOLDER_IMAGE;
  const rewardTitle = isCoinRewardVisible
    ? '코인 3,000개 획득!'
    : isRewardClaimed
      ? '1기 포착단 뱃지 획득!'
      : `${rewardTier}등급 카드 획득!`;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + scaleByDeviceWidth(10) },
      ]}
    >
      <View style={styles.header}>
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
          <Image source={BACK_ICON_IMAGE} style={styles.backIcon} />
        </Pressable>
      </View>
      <Image
        accessibilityLabel="아래 보상을 확인하고 맞다면 보상받기 버튼을 눌러주세요"
        resizeMode="contain"
        source={REWARD_GUIDE_IMAGE}
        style={styles.rewardGuide}
      />
      <Image
        accessibilityLabel="S등급 카드, 1기 포착팜 배지, 코인 3,000개"
        resizeMode="contain"
        source={REWARD_CARD_IMAGE}
        style={styles.rewardCard}
      />
      <Pressable
        accessibilityLabel="수령하기"
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading }}
        disabled={isLoading}
        onPress={() => void handleCompletePress()}
        style={({ pressed }) => [
          styles.completeButtonContainer,
          { bottom: insets.bottom + scaleByDeviceWidth(47) },
          pressed && styles.pressed,
        ]}
      >
        <Image
          resizeMode="contain"
          source={COMPLETE_BUTTON_IMAGE}
          style={styles.completeButton}
        />
      </Pressable>
      {isRewardResultVisible && (
        <ScrollView
          accessibilityLabel="카드를 확인해주세요. 아래 카드가 맞다면 농장에 저장하기를 클릭해주세요."
          accessibilityViewIsModal
          contentContainerStyle={[
            styles.rewardResultContent,
            { paddingTop: scaleByDeviceWidth(98.13) },
          ]}
          showsVerticalScrollIndicator={false}
          style={styles.rewardResultOverlay}
        >
          {!isRewardClaimed && !isCoinRewardVisible ? (
            <Image
              accessibilityLabel={`${rewardTier}등급 카드`}
              onError={() => setHasCardImageError(true)}
              resizeMode="stretch"
              source={cardFrontImageSource}
              style={styles.cardRewardCard}
            />
          ) : isRewardClaimed && !isCoinRewardVisible ? (
            <View style={styles.cardRewardCard}>
              <View style={styles.badgeRewardVisual}>
                <Image
                  accessibilityLabel="1기 포착단 뱃지 보상 광채"
                  resizeMode="contain"
                  source={BADGE_REWARD_IMAGE}
                  style={styles.badgeRewardGlow}
                />
                <Image
                  accessibilityLabel="1기 포착단 뱃지"
                  resizeMode="contain"
                  source={BADGE_REWARD_ICON_IMAGE}
                  style={styles.badgeRewardIcon}
                />
              </View>
            </View>
          ) : (
            <View style={styles.cardRewardCard}>
              <View style={styles.badgeRewardVisual}>
                <Image
                  accessibilityLabel="코인 보상 광채"
                  resizeMode="contain"
                  source={BADGE_REWARD_IMAGE}
                  style={styles.badgeRewardGlow}
                />
                <Image
                  accessibilityLabel="코인 3,000개"
                  resizeMode="contain"
                  source={COIN_REWARD_ICON_IMAGE}
                  style={styles.coinRewardIcon}
                />
              </View>
            </View>
          )}
          <Text style={styles.cardRewardTitle}>{rewardTitle}</Text>
          <Text style={styles.cardRewardGuide}>다음으로를 클릭해주세요</Text>
          <Image
            accessibilityLabel="보상 진행 단계"
            resizeMode="contain"
            source={
              isCoinRewardVisible
                ? COIN_REWARD_PAWS_IMAGE
                : isRewardClaimed
                  ? BADGE_REWARD_PAWS_IMAGE
                  : CARD_REWARD_PAWS_IMAGE
            }
            style={styles.cardRewardPaws}
          />
          <Pressable
            accessibilityLabel="다음으로"
            accessibilityRole="button"
            onPress={handleRewardButtonPress}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              resizeMode="contain"
              source={NEXT_BUTTON_IMAGE}
              style={styles.nextButtonImage}
            />
          </Pressable>
        </ScrollView>
      )}
      <ErrorModal
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FAF5EB',
  },
  header: {
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
  rewardGuide: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(86),
    marginTop: scaleByDeviceWidth(42),
  },
  completeButtonContainer: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
  },
  completeButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  pressed: {
    opacity: 0.65,
  },
  rewardResultOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: '#000000',
  },
  rewardResultContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: scaleByDeviceWidth(24),
    backgroundColor: '#000000',
  },
  rewardCard: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(176),
    marginTop: scaleByDeviceWidth(26),
  },
  cardRewardCard: {
    width: scaleByDeviceWidth(281.5),
    height: scaleByDeviceWidth(396.56),
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeRewardVisual: {
    position: 'absolute',
    top: scaleByDeviceWidth(82.75),
    width: scaleByDeviceWidth(242.98),
    height: scaleByDeviceWidth(242.98),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRewardGlow: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  badgeRewardIcon: {
    width: scaleByDeviceWidth(114.32),
    height: scaleByDeviceWidth(114.32),
  },
  coinRewardIcon: {
    width: scaleByDeviceWidth(194.5),
    height: scaleByDeviceWidth(194.5),
  },
  cardRewardTitle: {
    marginTop: scaleByDeviceWidth(24),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(24),
  },
  cardRewardGuide: {
    marginTop: scaleByDeviceWidth(5.5),
    color: '#A4A499',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(16),
  },
  cardRewardPaws: {
    width: scaleByDeviceWidth(73.51),
    height: scaleByDeviceWidth(16),
    marginTop: scaleByDeviceWidth(29.5),
  },
  nextButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
    marginTop: scaleByDeviceWidth(40),
    flexShrink: 0,
  },
  nextButtonImage: {
    width: '100%',
    height: '100%',
  },
});
