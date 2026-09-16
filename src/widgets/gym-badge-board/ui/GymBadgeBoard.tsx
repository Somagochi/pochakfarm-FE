import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

const BOARD_BACKGROUND = require('@/src/shared/assets/images/collection/gym-badge-board.png');
const BOARD_COVER = require('@/src/shared/assets/images/collection/gym-badge-cover.png');

const BADGE_HOLE_HEIGHT = 100;
const BADGE_HOLE_WIDTH = 100;
const BADGE_ROW_GAP = 28;
const BADGE_ROW_STEP = BADGE_HOLE_HEIGHT + BADGE_ROW_GAP;
const LEFT_COLUMN = 62;
const RIGHT_COLUMN = 198;
const LEFT_COLUMN_TOP = 63;
const RIGHT_COLUMN_TOP = 107;

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
  const { badges, clearError, errorMessage, reload } = useBadges();
  const [isCoverVisible, setIsCoverVisible] = useState(true);
  const [isCoverOpening, setIsCoverOpening] = useState(false);
  const coverOpeningProgress = useRef(new Animated.Value(0)).current;
  useRefreshOnFocus(reload);

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

          return (
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={badge?.name}
              accessible={badge !== undefined}
              key={badge?.code ?? `empty-badge-slot-${index}`}
              resizeMode="contain"
              source={badge ? { uri: badge.imageUrl } : slot.emptySource}
              style={[
                styles.badgeHole,
                {
                  left: scaleByDeviceWidth(slot.left),
                  top: scaleByDeviceWidth(slot.top),
                },
              ]}
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
            <Animated.Image
              accessibilityIgnoresInvertColors
              resizeMode="stretch"
              source={BOARD_COVER}
              style={[styles.cover, coverAnimatedStyle]}
            />
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
    top: scaleByDeviceWidth(-6),
    left: 0,
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(684),
  },
  cover: {
    width: '100%',
    height: '100%',
  },
});
