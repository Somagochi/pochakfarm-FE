import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { useBadges } from '@/src/entities/badge';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useRefreshOnFocus } from '@/src/shared/lib/navigation/useRefreshOnFocus';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

import {
  GymLeaderStickerThumbnail,
  STICKER_CANVAS_SIZE,
  STICKER_EFFECT_PADDING,
} from './GymLeaderStickerThumbnail';

const BOARD_BACKGROUND = require('@/src/shared/assets/images/collection/gym-badge-board.png');
const BOARD_COVER = require('@/src/shared/assets/images/collection/gym-badge-cover.png');

const BADGE_HOLE_HEIGHT = 100;
const BADGE_HOLE_WIDTH = 100;
const BADGE_THUMBNAIL_SIZE = 140;
const BADGE_THUMBNAIL_OFFSET =
  (BADGE_THUMBNAIL_SIZE - BADGE_HOLE_WIDTH) / 2;
const BADGE_ROW_GAP = 28;
const BADGE_ROW_STEP = BADGE_HOLE_HEIGHT + BADGE_ROW_GAP;
const LEFT_COLUMN = 62;
const RIGHT_COLUMN = 198;
const LEFT_COLUMN_TOP = 63;
const RIGHT_COLUMN_TOP = 107;
const COVER_TOP = -6;

const EMPTY_BADGE_HOLES = [
  require('@/src/shared/assets/images/collection/gym-badge-hole-1.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-5.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-2.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-6.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-3.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-7.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-4.png'),
  require('@/src/shared/assets/images/collection/gym-badge-hole-8.png'),
];

const BADGE_SLOTS: {
  emptySource: ImageSourcePropType;
  left: number;
  top: number;
}[] = EMPTY_BADGE_HOLES.map((emptySource, index) => {
  const isLeftColumn = index % 2 === 0;
  const rowIndex = Math.floor(index / 2);

  return {
    emptySource,
    left: isLeftColumn ? LEFT_COLUMN : RIGHT_COLUMN,
    top:
      (isLeftColumn ? LEFT_COLUMN_TOP : RIGHT_COLUMN_TOP) +
      BADGE_ROW_STEP * rowIndex,
  };
});

export function GymBadgeBoard() {
  const {
    badges,
    clearError,
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
    reload,
  } = useBadges();
  const [isCoverVisible, setIsCoverVisible] = useState(true);
  const [isCoverOpening, setIsCoverOpening] = useState(false);
  const coverOpeningProgress = useRef(new Animated.Value(0)).current;
  useRefreshOnFocus(reload);

  useEffect(() => {
    if (badges.length < BADGE_SLOTS.length && hasNext && !isLoading) {
      loadNextPage();
    }
  }, [badges.length, hasNext, isLoading, loadNextPage]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        coverOpeningProgress.stopAnimation();
        coverOpeningProgress.setValue(0);
        setIsCoverOpening(false);
        setIsCoverVisible(true);
      };
    }, [coverOpeningProgress]),
  );

  const openCover = () => {
    if (isCoverOpening) {
      return;
    }

    setIsCoverOpening(true);
    Animated.timing(coverOpeningProgress, {
      duration: 750,
      easing: Easing.inOut(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsCoverVisible(false);
        setIsCoverOpening(false);
      }
    });
  };

  const coverAnimatedStyle = {
    opacity: coverOpeningProgress.interpolate({
      inputRange: [0, 0.72, 1],
      outputRange: [1, 1, 0],
    }),
    transform: [
      {
        translateY: coverOpeningProgress.interpolate({
          inputRange: [0, 0.24, 1],
          outputRange: [
            0,
            0,
            scaleByDeviceWidth(-720),
          ],
        }),
      },
      {
        scale: coverOpeningProgress.interpolate({
          inputRange: [0, 0.24, 1],
          outputRange: [1, 1.05, 1.05],
        }),
      },
    ],
  };

  return (
    <>
      <View style={styles.board}>
        <Image
          accessible={false}
          source={BOARD_BACKGROUND}
          style={styles.boardBackground}
        />

        {BADGE_SLOTS.map((slot, index) => {
          const badge = badges[index];
          const imageStyle = [
            styles.badgeHole,
            {
              left: scaleByDeviceWidth(slot.left),
              top: scaleByDeviceWidth(slot.top),
            },
          ];

          if (badge?.imageUrl) {
            return (
              <ExpoImage
                accessibilityLabel={badge.name}
                accessibilityRole="image"
                allowDownscaling
                cachePolicy="memory-disk"
                contentFit="contain"
                key={badge.code}
                source={{ uri: badge.imageUrl }}
                style={imageStyle}
              />
            );
          }

          return (
            <Image
              accessible={false}
              key={`empty-badge-slot-${index}`}
              resizeMode="contain"
              source={slot.emptySource}
              style={imageStyle}
            />
          );
        })}

        {isCoverVisible ? (
          <Pressable
            accessibilityLabel="관장뱃지 덮개 열기"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCoverOpening }}
            disabled={isCoverOpening}
            onPress={openCover}
            style={styles.coverButton}
          >
            <Animated.View
              needsOffscreenAlphaCompositing
              pointerEvents="none"
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={[styles.coverAnimatedLayer, coverAnimatedStyle]}
            >
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="stretch"
                source={BOARD_COVER}
                style={styles.cover}
              />
              {BADGE_SLOTS.map((slot, index) => {
                const badge = badges[index];

                if (!badge) {
                  return null;
                }

                return (
                  <GymLeaderStickerThumbnail
                    imageUrl={badge.thumbnailImageUrl}
                    key={`badge-thumbnail-${badge.code}`}
                    style={[
                      styles.badgeThumbnail,
                      index === 0 && styles.firstBadgeThumbnail,
                      index === 1 && styles.secondBadgeThumbnail,
                      index === 2 && styles.thirdBadgeThumbnail,
                      index === 3 && styles.fourthBadgeThumbnail,
                      index === 4 && styles.fifthBadgeThumbnail,
                      index === 5 && styles.sixthBadgeThumbnail,
                      index === 6 && styles.seventhBadgeThumbnail,
                      index === 7 && styles.eighthBadgeThumbnail,
                      {
                        left: scaleByDeviceWidth(
                          slot.left -
                            BADGE_THUMBNAIL_OFFSET -
                            STICKER_EFFECT_PADDING,
                        ),
                        top: scaleByDeviceWidth(
                          slot.top -
                            COVER_TOP -
                            BADGE_THUMBNAIL_OFFSET -
                            STICKER_EFFECT_PADDING,
                        ),
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>
          </Pressable>
        ) : null}
      </View>
      <ErrorModal message={errorMessage} onClose={clearError} />
    </>
  );
}

const styles = StyleSheet.create({
  board: {
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(684),
  },
  boardBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(658),
  },
  badgeHole: {
    position: 'absolute',
    width: scaleByDeviceWidth(BADGE_HOLE_WIDTH),
    height: scaleByDeviceWidth(BADGE_HOLE_HEIGHT),
  },
  coverButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(COVER_TOP),
    left: 0,
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(684),
  },
  coverAnimatedLayer: {
    width: '100%',
    height: '100%',
  },
  cover: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  badgeThumbnail: {
    position: 'absolute',
    width: scaleByDeviceWidth(STICKER_CANVAS_SIZE),
    height: scaleByDeviceWidth(STICKER_CANVAS_SIZE),
  },
  firstBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(-13) },
      { translateY: scaleByDeviceWidth(18) },
      { rotate: '-14deg' },
    ],
  },
  secondBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(17) },
      { translateY: scaleByDeviceWidth(10) },
      { rotate: '14deg' },
    ],
  },
  thirdBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(18) },
      { translateY: scaleByDeviceWidth(23) },
      { rotate: '3deg' },
    ],
  },
  fourthBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(-12) },
      { translateY: scaleByDeviceWidth(18) },
      { rotate: '-5deg' },
    ],
  },
  fifthBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(-23) },
      { translateY: scaleByDeviceWidth(10) },
      { rotate: '-5deg' },
    ],
  },
  sixthBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(12) },
      { translateY: scaleByDeviceWidth(15) },
      { rotate: '5deg' },
    ],
  },
  seventhBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(20) },
      { translateY: scaleByDeviceWidth(5) },
      { rotate: '-3deg' },
    ],
  },
  eighthBadgeThumbnail: {
    transform: [
      { translateX: scaleByDeviceWidth(-18) },
      { translateY: scaleByDeviceWidth(6) },
      { rotate: '-3deg' },
      { scale: 0.9 },
    ],
  },
});
