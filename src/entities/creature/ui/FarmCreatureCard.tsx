import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import type {
  CreatureEnvironment,
  CreatureTier,
  FarmCreatureListItem,
} from '../model/types';

const CARD_BACKGROUND = require('@/src/shared/assets/images/farm-search/creature-search-card-background.png');
const SELECTED_CARD_BACKGROUND = require('@/src/shared/assets/images/battle/selected-creature-card-background.png');
const CARD_DIVIDER = require('@/src/shared/assets/images/farm-search/creature-card-divider.png');
const ANIMAL_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/animal-image-placeholder.png');
const TYPE_BADGES: Record<CreatureEnvironment, number> = {
  land: require('@/src/shared/assets/images/farm-search/land-badge.png'),
  sea: require('@/src/shared/assets/images/farm-search/sea-badge.png'),
  sky: require('@/src/shared/assets/images/farm-search/sky-badge.png'),
  space: require('@/src/shared/assets/images/farm-search/space-badge.png'),
};
const TIER_BADGES: Record<CreatureTier, number> = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
};

type FarmCreatureCardProps = {
  creature: FarmCreatureListItem;
  onPress?: () => void;
  selectionOrder?: number;
};

export function FarmCreatureCard({
  creature,
  onPress,
  selectionOrder,
}: FarmCreatureCardProps) {
  const isSelected = selectionOrder !== undefined;
  const [failedCreatureImageUri, setFailedCreatureImageUri] =
    useState<string | null>(null);
  const hasCreatureImageFailed =
    creature.creatureImageUri !== undefined &&
    failedCreatureImageUri === creature.creatureImageUri;

  return (
    <Pressable
      accessibilityLabel={`${creature.name}, ${creature.tier} 티어`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <Image
        resizeMode="stretch"
        source={isSelected ? SELECTED_CARD_BACKGROUND : CARD_BACKGROUND}
        style={styles.cardImage}
      />
      <Image
        defaultSource={ANIMAL_IMAGE_PLACEHOLDER}
        onError={() => {
          if (creature.creatureImageUri) {
            setFailedCreatureImageUri(creature.creatureImageUri);
          }
        }}
        resizeMode="contain"
        source={
          creature.creatureImageSource && !hasCreatureImageFailed
            ? creature.creatureImageSource
            : ANIMAL_IMAGE_PLACEHOLDER
        }
        style={styles.creatureImage}
      />
      <Image
        resizeMode="contain"
        source={TIER_BADGES[creature.tier]}
        style={styles.tierBadge}
      />
      <Image
        resizeMode="contain"
        source={TYPE_BADGES[creature.environment]}
        style={styles.typeBadge}
      />
      <Image
        resizeMode="stretch"
        source={CARD_DIVIDER}
        style={styles.divider}
      />
      {isSelected ? (
        <View style={styles.selectedNameRow}>
          <Text numberOfLines={1} style={styles.selectedCreatureName}>
            {creature.name}
          </Text>
          <Animated.View
            entering={ZoomIn.duration(180)}
            exiting={ZoomOut.duration(100)}
            key={`selection-order-${selectionOrder}`}
            style={styles.selectionOrderBadge}
          >
            <Text style={styles.selectionOrderText}>{selectionOrder}</Text>
          </Animated.View>
        </View>
      ) : (
        <Text numberOfLines={1} style={styles.creatureName}>
          {creature.name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: scaleByDeviceWidth(100),
    height: scaleByDeviceWidth(142.57),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tierBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(12),
    left: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(15),
    height: scaleByDeviceWidth(23),
  },
  typeBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    right: scaleByDeviceWidth(11),
    width: scaleByDeviceWidth(21),
    height: scaleByDeviceWidth(29),
  },
  divider: {
    position: 'absolute',
    top: scaleByDeviceWidth(93),
    left: scaleByDeviceWidth(11.5),
    width: scaleByDeviceWidth(77),
    height: scaleByDeviceWidth(1),
  },
  creatureImage: {
    position: 'absolute',
    top: scaleByDeviceWidth(38),
    left: scaleByDeviceWidth(15),
    width: scaleByDeviceWidth(70),
    height: scaleByDeviceWidth(70),
  },
  creatureName: {
    position: 'absolute',
    top: scaleByDeviceWidth(103),
    left: scaleByDeviceWidth(4),
    width: scaleByDeviceWidth(92),
    color: '#302F2A',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(21),
    textAlign: 'center',
  },
  selectedNameRow: {
    position: 'absolute',
    top: scaleByDeviceWidth(103),
    left: scaleByDeviceWidth(4),
    width: scaleByDeviceWidth(92),
    height: scaleByDeviceWidth(21),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleByDeviceWidth(4),
  },
  selectedCreatureName: {
    maxWidth: scaleByDeviceWidth(68),
    color: '#302F2A',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(21),
  },
  selectionOrderBadge: {
    width: scaleByDeviceWidth(16),
    height: scaleByDeviceWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: '#FFD34E',
  },
  selectionOrderText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(13),
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
