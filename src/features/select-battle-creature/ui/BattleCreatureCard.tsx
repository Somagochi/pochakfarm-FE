import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import type {
  CreatureEnvironment,
  CreatureTier,
  FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { AutoSweepCardSkiaReflection } from '@/src/shared/ui/CardSkiaReflection';

const CARD_BACKGROUND = require('@/src/shared/assets/images/battle/battle-creature-card-2-column.png');
const SELECTED_CARD_BACKGROUND = require('@/src/shared/assets/images/battle/battle-creature-card-selected-2-column.png');
const SKILL_PANEL = require('@/src/shared/assets/images/battle/battle-creature-skill-panel-2-column.png');
const CARD_DIVIDER = require('@/src/shared/assets/images/farm-search/creature-card-divider.png');
const ANIMAL_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/animal-image-placeholder.png');

const TYPE_BADGES: Record<CreatureEnvironment, number> = {
  land: require('@/src/shared/assets/images/battle/battle-type-land.png'),
  sea: require('@/src/shared/assets/images/battle/battle-type-sea.png'),
  sky: require('@/src/shared/assets/images/battle/battle-type-sky.png'),
  space: require('@/src/shared/assets/images/battle/battle-type-space.png'),
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

const CARD_WIDTH = scaleByDeviceWidth(150);
const CARD_HEIGHT = CARD_WIDTH * (1044 / 620);
const SKILL_PANEL_HEIGHT = scaleByDeviceWidth(50);
const SKILL_PANEL_TOP = CARD_HEIGHT - SKILL_PANEL_HEIGHT - scaleByDeviceWidth(18);
const NAME_ROW_HEIGHT = scaleByDeviceWidth(24);
const NAME_ROW_TOP = SKILL_PANEL_TOP - scaleByDeviceWidth(8) - NAME_ROW_HEIGHT;
const DIVIDER_HEIGHT = scaleByDeviceWidth(1);
const DIVIDER_TOP = NAME_ROW_TOP - scaleByDeviceWidth(8) - DIVIDER_HEIGHT;

type BattleCreatureCardProps = {
  creature: FarmCreatureListItem;
  hasRecommendationEffect?: boolean;
  nowMs?: number;
  onPress?: () => void;
  selectionOrder?: number;
};

export function BattleCreatureCard({
  creature,
  hasRecommendationEffect = false,
  nowMs = Date.now(),
  onPress,
  selectionOrder,
}: BattleCreatureCardProps) {
  const isSelected = selectionOrder !== undefined;
  const restEndMs = creature.restEndsAt
    ? Date.parse(creature.restEndsAt)
    : Number.NaN;
  const remainingRestSeconds = Number.isFinite(restEndMs)
    ? Math.max(0, Math.ceil((restEndMs - nowMs) / 1000))
    : 0;
  const isResting = remainingRestSeconds > 0;
  const remainingRestTime = `${String(
    Math.floor(remainingRestSeconds / 60),
  ).padStart(2, '0')}:${String(remainingRestSeconds % 60).padStart(2, '0')}`;
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
      accessibilityLabel={
        isResting
          ? `${creature.name}, 휴식 중, 남은 시간 ${remainingRestTime}`
          : `${creature.name}, ${creature.tier} 티어`
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: isResting, selected: isSelected }}
      disabled={isResting}
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
      {isResting && (
        <View pointerEvents="none" style={styles.restOverlay}>
          <ActivityIndicator
            color="#FFFFFF"
            size="small"
            style={styles.restIndicator}
          />
          <Text style={styles.restLabel}>휴식중</Text>
          <Text style={styles.restTime}>{remainingRestTime}</Text>
        </View>
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
    top: scaleByDeviceWidth(12.5),
    left: scaleByDeviceWidth(11.89),
    width: scaleByDeviceWidth(30),
    height: scaleByDeviceWidth(32),
  },
  typeBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(2),
    right: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(34),
    height: scaleByDeviceWidth(48),
  },
  creatureImage: {
    position: 'absolute',
    top: scaleByDeviceWidth(43),
    left: scaleByDeviceWidth(7.5),
    width: scaleByDeviceWidth(135),
    height: scaleByDeviceWidth(96),
  },
  divider: {
    position: 'absolute',
    top: DIVIDER_TOP,
    left: scaleByDeviceWidth(17.25),
    width: scaleByDeviceWidth(115.5),
    height: DIVIDER_HEIGHT,
  },
  nameRow: {
    position: 'absolute',
    top: NAME_ROW_TOP,
    left: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(126),
    height: NAME_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleByDeviceWidth(3),
  },
  creatureName: {
    maxWidth: scaleByDeviceWidth(98),
    color: '#302F2A',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(22),
    textAlign: 'center',
  },
  selectionOrderBadge: {
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleByDeviceWidth(10),
    backgroundColor: '#FFD34E',
  },
  selectionOrderText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(16),
    textAlign: 'center',
  },
  skillPanel: {
    position: 'absolute',
    top: SKILL_PANEL_TOP,
    left: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(126),
    height: SKILL_PANEL_HEIGHT,
  },
  skills: {
    position: 'absolute',
    top: SKILL_PANEL_TOP,
    left: scaleByDeviceWidth(22),
    width: scaleByDeviceWidth(106),
    height: SKILL_PANEL_HEIGHT,
  },
  skillRow: {
    height: scaleByDeviceWidth(25),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillName: {
    width: scaleByDeviceWidth(64),
    color: '#69583F',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
  skillType: {
    width: scaleByDeviceWidth(39),
    height: scaleByDeviceWidth(17),
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingTop: CARD_HEIGHT * (390 / 1044),
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    overflow: 'hidden',
  },
  restIndicator: {
    marginBottom: scaleByDeviceWidth(20),
  },
  restLabel: {
    color: '#858585',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(20),
  },
  restTime: {
    marginTop: scaleByDeviceWidth(13),
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(25),
    lineHeight: scaleByDeviceWidth(32),
  },
  pressed: {
    opacity: 0.8,
  },
});
