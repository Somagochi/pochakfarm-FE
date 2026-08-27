import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import type {
  CreatureEnvironment,
  CreatureTier,
  FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { AutoSweepCardSkiaReflection } from '@/src/shared/ui/CardSkiaReflection';

const CARD_BACKGROUND = require('@/src/shared/assets/images/battle/battle-creature-card.png');
const SELECTED_CARD_BACKGROUND = require('@/src/shared/assets/images/battle/battle-creature-card-selected.png');
const SKILL_PANEL = require('@/src/shared/assets/images/battle/battle-creature-skill-panel.png');
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

const SKILL_TYPES = {
  balance: require('@/src/shared/assets/images/battle/balance-skill-type.png'),
  competitive: require('@/src/shared/assets/images/battle/competitive-skill-type.png'),
  stable: require('@/src/shared/assets/images/battle/stable-skill-type.png'),
} as const;

const SKILLS = [
  { name: '구름 숨기', type: SKILL_TYPES.stable },
  { name: '바람 돌진', type: SKILL_TYPES.balance },
  { name: '단단한 방어', type: SKILL_TYPES.stable },
  { name: '회오리 공격', type: SKILL_TYPES.competitive },
  { name: '물결 타기', type: SKILL_TYPES.balance },
  { name: '별빛 응원', type: SKILL_TYPES.competitive },
] as const;

const CARD_WIDTH = scaleByDeviceWidth(100);
const CARD_HEIGHT = scaleByDeviceWidth(187.41);

type BattleCreatureCardProps = {
  creature: FarmCreatureListItem;
  hasRecommendationEffect?: boolean;
  onPress?: () => void;
  selectionOrder?: number;
};

export function BattleCreatureCard({
  creature,
  hasRecommendationEffect = false,
  onPress,
  selectionOrder,
}: BattleCreatureCardProps) {
  const isSelected = selectionOrder !== undefined;
  const [failedCreatureImageUri, setFailedCreatureImageUri] =
    useState<string | null>(null);
  const hasCreatureImageFailed =
    creature.creatureImageUri !== undefined &&
    failedCreatureImageUri === creature.creatureImageUri;
  const creatureSkills = useMemo(() => {
    const numericId = Number.parseInt(creature.id, 10);
    const startIndex = Number.isNaN(numericId) ? 0 : numericId % SKILLS.length;

    return [SKILLS[startIndex], SKILLS[(startIndex + 1) % SKILLS.length]];
  }, [creature.id]);

  return (
    <Pressable
      accessibilityLabel={`${creature.name}, ${creature.tier} 티어`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
      <Image source={TYPE_BADGES[creature.environment]} style={styles.typeBadge} />
      <Image resizeMode="stretch" source={CARD_DIVIDER} style={styles.divider} />

      <View style={styles.nameRow}>
        <Text numberOfLines={1} style={styles.creatureName}>
          {creature.name}
        </Text>
        {isSelected && (
          <Animated.View
            entering={ZoomIn.duration(180)}
            exiting={ZoomOut.duration(100)}
            key={`selection-order-${selectionOrder}`}
            style={styles.selectionOrderBadge}
          >
            <Text style={styles.selectionOrderText}>{selectionOrder}</Text>
          </Animated.View>
        )}
      </View>

      <Image resizeMode="stretch" source={SKILL_PANEL} style={styles.skillPanel} />
      <View style={styles.skills}>
        {creatureSkills.map((skill) => (
          <View key={skill.name} style={styles.skillRow}>
            <Text numberOfLines={1} style={styles.skillName}>
              {skill.name}
            </Text>
            <Image resizeMode="contain" source={skill.type} style={styles.skillType} />
          </View>
        ))}
      </View>
      {hasRecommendationEffect && (
        <AutoSweepCardSkiaReflection
          cardHeight={CARD_HEIGHT}
          cardWidth={CARD_WIDTH}
          centerLabel="추천!"
          variant="tier-ss"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tierBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(12),
    left: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(21.91),
    height: scaleByDeviceWidth(23.29),
  },
  typeBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    right: scaleByDeviceWidth(8),
    width: scaleByDeviceWidth(22),
    height: scaleByDeviceWidth(29),
  },
  creatureImage: {
    position: 'absolute',
    top: scaleByDeviceWidth(37),
    left: scaleByDeviceWidth(15),
    width: scaleByDeviceWidth(70),
    height: scaleByDeviceWidth(55),
  },
  divider: {
    position: 'absolute',
    top: scaleByDeviceWidth(101),
    left: scaleByDeviceWidth(11.5),
    width: scaleByDeviceWidth(77),
    height: scaleByDeviceWidth(1),
  },
  nameRow: {
    position: 'absolute',
    top: scaleByDeviceWidth(108),
    left: scaleByDeviceWidth(8),
    width: scaleByDeviceWidth(84),
    height: scaleByDeviceWidth(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleByDeviceWidth(3),
  },
  creatureName: {
    maxWidth: scaleByDeviceWidth(65),
    color: '#302F2A',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(13),
    lineHeight: scaleByDeviceWidth(18),
    textAlign: 'center',
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
  skillPanel: {
    position: 'absolute',
    top: scaleByDeviceWidth(132),
    left: scaleByDeviceWidth(11.5),
    width: scaleByDeviceWidth(77),
    height: scaleByDeviceWidth(40),
  },
  skills: {
    position: 'absolute',
    top: scaleByDeviceWidth(132),
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(68),
    height: scaleByDeviceWidth(40),
  },
  skillRow: {
    height: scaleByDeviceWidth(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillName: {
    width: scaleByDeviceWidth(39),
    color: '#69583F',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(11),
  },
  skillType: {
    width: scaleByDeviceWidth(28),
    height: scaleByDeviceWidth(12),
  },
  pressed: {
    opacity: 0.8,
  },
});
