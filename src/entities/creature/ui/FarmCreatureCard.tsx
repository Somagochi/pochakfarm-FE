import {
  Image,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import type {
  CreatureEnvironment,
  CreatureTier,
  FarmCreatureListItem,
} from '../model/types';

const CARD_BACKGROUND = require('@/src/shared/assets/images/farm-search/creature-search-card-background.png');
const CARD_DIVIDER = require('@/src/shared/assets/images/farm-search/creature-card-divider.png');
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
};

export function FarmCreatureCard({
  creature,
  onPress,
}: FarmCreatureCardProps) {
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
        source={CARD_BACKGROUND}
        style={styles.cardImage}
      />
      {creature.creatureImageSource && (
        <Image
          resizeMode="contain"
          source={creature.creatureImageSource}
          style={styles.creatureImage}
        />
      )}
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
      <Text numberOfLines={1} style={styles.creatureName}>
        {creature.name}
      </Text>
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
    fontFamily: 'Pretendard-Regular',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(21),
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
