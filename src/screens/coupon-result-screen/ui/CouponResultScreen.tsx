import { useEffect, useRef, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AnimalCardType } from '@/src/entities/creature';
import { BADGE_REWARD_GUIDE_IMAGE } from '@/src/shared/assets/images/coupon-result/badgeRewardGuideImage';
import { COIN_REWARD_IMAGE } from '@/src/shared/assets/images/coupon-result/coinRewardImage';
import { COIN_REWARD_GUIDE_IMAGE } from '@/src/shared/assets/images/coupon-result/coinRewardGuideImage';
import { REWARD_BUTTON_IMAGE } from '@/src/shared/assets/images/coupon-result/rewardButtonImage';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const REWARD_CONFIRMATION_TITLE_IMAGE = require('@/src/shared/assets/images/coupon-result/title.png');
const REWARD_GUIDE_IMAGE = require('@/src/shared/assets/images/coupon-result/reward-guide.png');
const REWARD_CARD_IMAGE = require('@/src/shared/assets/images/coupon-result/reward-card.png');
const COMPLETE_BUTTON_IMAGE = require('@/src/shared/assets/images/coupon-result/complete-button.png');
const BACK_ICON_IMAGE = require('@/src/shared/assets/images/coupon-registration/back-icon.png');
const CARD_CONFIRMATION_GUIDE_IMAGE = require('@/src/shared/assets/images/coupon-result/card-confirmation-guide.png');
const CARD_FRONT_PLACEHOLDER_IMAGE = require('@/src/shared/assets/images/farm/card-image-placeholder.png');
const CARD_BACK_IMAGES: Record<AnimalCardType, number> = {
  GROUND: require('@/src/shared/assets/images/farm/card-back-ground.png'),
  SEA: require('@/src/shared/assets/images/farm/card-back-sea.png'),
  SKY: require('@/src/shared/assets/images/farm/kkomi-card-back.png'),
  SPACE: require('@/src/shared/assets/images/farm/card-back-space.png'),
};

function isAnimalCardType(value: string | undefined): value is AnimalCardType {
  return value !== undefined && value in CARD_BACK_IMAGES;
}

export function CouponResultScreen() {
  const insets = useSafeAreaInsets();
  const [isRewardResultVisible, setIsRewardResultVisible] = useState(false);
  const [isCardFlipping, setIsCardFlipping] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [hasCardImageError, setHasCardImageError] = useState(false);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [isCoinRewardVisible, setIsCoinRewardVisible] = useState(false);
  const cardFlipProgress = useRef(new Animated.Value(0)).current;
  const rewardResultScrollRef = useRef<ScrollView>(null);
  const { cardImageUrl, cardType } = useLocalSearchParams<{
    cardImageUrl?: string;
    cardType?: string;
  }>();
  const rewardCardBackImage = CARD_BACK_IMAGES[
    isAnimalCardType(cardType) ? cardType : 'GROUND'
  ];

  function handleCompletePress() {
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
    rewardResultScrollRef.current?.scrollTo({ animated: false, y: 0 });
  }

  function handleCardPress() {
    if (isCardFlipping || isCardRevealed) {
      return;
    }

    setIsCardFlipping(true);
    Animated.timing(cardFlipProgress, {
      toValue: 0.5,
      duration: 350,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setIsCardFlipping(false);
        return;
      }

      setIsCardRevealed(true);
      Animated.timing(cardFlipProgress, {
        toValue: 1,
        duration: 350,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setIsCardFlipping(false));
    });
  }

  const cardBackRotateY = cardFlipProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const cardFrontRotateY = cardFlipProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const cardBackOpacity = cardFlipProgress.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const cardFrontOpacity = cardFlipProgress.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  const cardFrontImageSource =
    cardImageUrl && !hasCardImageError
      ? { uri: cardImageUrl }
      : CARD_FRONT_PLACEHOLDER_IMAGE;
  const coinRewardTop =
    scaleByDeviceWidth(168) - insets.top - scaleByDeviceWidth(52);

  useEffect(() => {
    if (!isCardRevealed) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      rewardResultScrollRef.current?.scrollToEnd({ animated: true });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [isCardRevealed]);

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
        <Image
          accessibilityLabel="보상 확인"
          resizeMode="contain"
          source={REWARD_CONFIRMATION_TITLE_IMAGE}
          style={styles.title}
        />
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
        accessibilityLabel="완료하기"
        accessibilityRole="button"
        onPress={handleCompletePress}
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
            { paddingTop: insets.top + scaleByDeviceWidth(52) },
          ]}
          onContentSizeChange={() => {
            if (isCardRevealed) {
              rewardResultScrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ref={rewardResultScrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.rewardResultOverlay}
        >
          {isCoinRewardVisible ? (
            <View style={styles.coinRewardStage}>
              <ExpoImage
                accessibilityLabel="포착팜 코인 보상"
                contentFit="fill"
                source={COIN_REWARD_IMAGE}
                style={[
                  styles.coinRewardImage,
                  { top: coinRewardTop },
                ]}
              />
              <ExpoImage
                accessibilityLabel="3,000 코인 획득! 보상 받기를 클릭해주세요"
                contentFit="fill"
                source={COIN_REWARD_GUIDE_IMAGE}
                style={[
                  styles.coinRewardGuide,
                  {
                    top:
                      coinRewardTop +
                      scaleByDeviceWidth(274.08 + 24),
                  },
                ]}
              />
            </View>
          ) : isRewardClaimed ? (
            <>
              <View style={styles.rewardResultMessageSlot}>
                <ExpoImage
                  accessibilityLabel="1기 포착팜 배지 획득! 보상 받기를 클릭해주세요"
                  contentFit="fill"
                  source={BADGE_REWARD_GUIDE_IMAGE}
                  style={styles.badgeRewardMessage}
                />
              </View>
              <View style={styles.revealCard} />
            </>
          ) : (
            <>
              <Image
                accessibilityLabel="카드를 확인해주세요. 아래 카드가 맞다면 농장에 저장하기를 클릭해주세요."
                resizeMode="contain"
                source={CARD_CONFIRMATION_GUIDE_IMAGE}
                style={styles.rewardResultMessage}
              />
              <Pressable
                accessibilityHint="누르면 카드 앞면을 확인할 수 있습니다"
                accessibilityLabel={
                  isCardRevealed ? '카드 앞면' : '카드 뒷면'
                }
                accessibilityRole="button"
                disabled={isCardFlipping || isCardRevealed}
                onPress={handleCardPress}
                style={styles.revealCard}
              >
                <Animated.Image
                  resizeMode="stretch"
                  source={rewardCardBackImage}
                  style={[
                    styles.rewardCardFace,
                    {
                      opacity: cardBackOpacity,
                      transform: [
                        { perspective: scaleByDeviceWidth(900) },
                        { rotateY: cardBackRotateY },
                      ],
                    },
                  ]}
                />
                <Animated.Image
                  onError={() => setHasCardImageError(true)}
                  resizeMode="stretch"
                  source={cardFrontImageSource}
                  style={[
                    styles.rewardCardFace,
                    {
                      opacity: cardFrontOpacity,
                      transform: [
                        { perspective: scaleByDeviceWidth(900) },
                        { rotateY: cardFrontRotateY },
                      ],
                    },
                  ]}
                />
              </Pressable>
            </>
          )}
          {isCardRevealed && (
            <Pressable
              accessibilityLabel="보상 받기"
              accessibilityRole="button"
              onPress={handleRewardButtonPress}
              style={({ pressed }) => [
                styles.rewardButton,
                pressed && styles.pressed,
              ]}
            >
              <ExpoImage
                contentFit="fill"
                source={REWARD_BUTTON_IMAGE}
                style={styles.rewardButtonImage}
              />
            </Pressable>
          )}
        </ScrollView>
      )}
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
  title: {
    width: scaleByDeviceWidth(84),
    height: scaleByDeviceWidth(28),
  },
  rewardGuide: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(86),
    marginTop: scaleByDeviceWidth(42),
  },
  revealCard: {
    width: scaleByDeviceWidth(281.5),
    height: scaleByDeviceWidth(396.56),
    minWidth: scaleByDeviceWidth(281.5),
    minHeight: scaleByDeviceWidth(396.56),
    marginTop: scaleByDeviceWidth(34.45),
    flexShrink: 0,
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
  rewardResultMessage: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(64),
  },
  rewardResultMessageSlot: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(64),
    alignItems: 'center',
  },
  badgeRewardMessage: {
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(47),
  },
  coinRewardStage: {
    width: '100%',
    height: scaleByDeviceWidth(495.01),
    alignItems: 'center',
  },
  coinRewardImage: {
    position: 'absolute',
    width: scaleByDeviceWidth(274.08),
    height: scaleByDeviceWidth(274.08),
  },
  coinRewardGuide: {
    position: 'absolute',
    width: scaleByDeviceWidth(312),
    height: scaleByDeviceWidth(47),
  },
  rewardCard: {
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(200),
    marginTop: scaleByDeviceWidth(32),
  },
  rewardCardFace: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  rewardButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
    marginTop: scaleByDeviceWidth(52.4),
    flexShrink: 0,
  },
  rewardButtonImage: {
    width: '100%',
    height: '100%',
  },
});
