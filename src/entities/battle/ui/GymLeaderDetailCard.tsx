import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

import type { GymLeaderAnimalCardType, GymLeaderDetail } from '../model/types';

const LEADER_PANEL = require('@/src/shared/assets/images/battle/gym-leader-info-panel.png');
const CREATURE_CARD = require('@/src/shared/assets/images/battle/gym-leader-animal-card.png');
const SEQUENCE_ARROW = require('@/src/shared/assets/images/battle/party-sequence-arrow.png');
const TYPE_BADGES: Record<GymLeaderAnimalCardType, number> = {
  GROUND: require('@/src/shared/assets/images/battle/battle-type-land.png'),
  SEA: require('@/src/shared/assets/images/battle/battle-type-sea.png'),
  SKY: require('@/src/shared/assets/images/battle/battle-type-sky.png'),
  SPACE: require('@/src/shared/assets/images/battle/battle-type-space.png'),
};
const TYPE_LABELS: Record<GymLeaderAnimalCardType, string> = {
  GROUND: '땅',
  SEA: '바다',
  SKY: '하늘',
  SPACE: '우주',
};
const TIER_BADGES: Record<string, number> = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
};
const DIFFICULTIES = [
  '초보',
  '초급',
  '중급',
  '중상급',
  '상급',
  '최상급',
  '달인',
  '챔피언',
] as const;
const WIDTH = scaleByDeviceWidth(328);
const HEIGHT = scaleByDeviceWidth(111.5);
const CARD_WIDTH = scaleByDeviceWidth(64);
const CARD_HEIGHT = scaleByDeviceWidth(86);
const ARROW_WIDTH = scaleByDeviceWidth(8);

type Props = { detail: GymLeaderDetail };

export function GymLeaderDetailCard({ detail }: Props) {
  const { gymLeader, animals } = detail;
  const difficulty = DIFFICULTIES[gymLeader.challengeOrder - 1] ?? '챔피언';
  const visibleAnimals = animals.slice(0, 3);
  const leaderType = visibleAnimals[0]
    ? TYPE_LABELS[visibleAnimals[0].cardType]
    : '';

  return (
    <View
      accessibilityLabel={`${gymLeader.challengeOrder}번째 관장 ${gymLeader.name}, 난이도 ${difficulty}, 출전 동물 ${visibleAnimals.length}마리`}
      style={styles.container}
    >
      <ImageBackground resizeMode="stretch" source={LEADER_PANEL} style={styles.leaderPanel}>
        <Text style={styles.leaderType}>{leaderType} 관장</Text>
        <Text numberOfLines={1} style={styles.leaderName}>{gymLeader.name}</Text>
        <Image
          accessibilityLabel={`${gymLeader.name} 관장`}
          resizeMode="contain"
          source={{ uri: gymLeader.imageUrl }}
          style={styles.leaderImage}
        />
        <View style={styles.difficulty}>
          <Text style={styles.difficultyValue}>{difficulty}</Text>
        </View>
      </ImageBackground>

      <Text numberOfLines={1} style={styles.description}>
        {gymLeader.name} 관장이 선택한 동물들이에요
      </Text>

      <View style={styles.animalList}>
        {visibleAnimals.map((animal, index) => (
          <View key={animal.orderNo} style={styles.animalSequence}>
            <ImageBackground resizeMode="stretch" source={CREATURE_CARD} style={styles.animalCard}>
              {TIER_BADGES[animal.tier] && (
                <Image
                  accessibilityLabel={`${animal.tier} 티어`}
                  resizeMode="contain"
                  source={TIER_BADGES[animal.tier]}
                  style={styles.tierBadge}
                />
              )}
              <Image
                accessibilityLabel={`${animal.cardType} 타입`}
                resizeMode="contain"
                source={
                  TYPE_BADGES[
                    animal.cardType.toUpperCase() as GymLeaderAnimalCardType
                  ]
                }
                style={styles.typeBadge}
              />
              <Image
                accessibilityLabel={`${animal.orderNo}번 동물 ${animal.animalName}`}
                resizeMode="contain"
                source={{ uri: animal.animalImageUrl }}
                style={styles.animalImage}
              />
              <Text numberOfLines={1} style={styles.animalName}>{animal.animalName}</Text>
            </ImageBackground>
            {index < visibleAnimals.length - 1 && (
              <Image accessible={false} resizeMode="contain" source={SEQUENCE_ARROW} style={styles.arrow} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: WIDTH, height: HEIGHT },
  leaderPanel: {
    position: 'absolute', top: 0, left: 0,
    width: scaleByDeviceWidth(112), height: HEIGHT,
  },
  leaderType: {
    position: 'absolute', top: scaleByDeviceWidth(11), left: scaleByDeviceWidth(12),
    color: '#CDB78E', fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(10), lineHeight: scaleByDeviceWidth(14),
  },
  leaderName: {
    position: 'absolute', top: scaleByDeviceWidth(26), left: scaleByDeviceWidth(12),
    maxWidth: scaleByDeviceWidth(54), color: '#66533F',
    fontFamily: 'EliceDXNeolli-Bold', fontSize: scaleByDeviceWidth(21),
    lineHeight: scaleByDeviceWidth(29),
  },
  leaderImage: {
    position: 'absolute', top: -scaleByDeviceWidth(10), left: scaleByDeviceWidth(35.5),
    width: scaleByDeviceWidth(86), height: scaleByDeviceWidth(139),
  },
  difficulty: {
    position: 'absolute', left: scaleByDeviceWidth(12), bottom: scaleByDeviceWidth(10),
  },
  difficultyValue: {
    color: '#907550', fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(9), lineHeight: scaleByDeviceWidth(13),
  },
  description: {
    position: 'absolute', top: scaleByDeviceWidth(7), left: scaleByDeviceWidth(107),
    width: scaleByDeviceWidth(221), color: '#8B704D',
    fontFamily: 'EliceDXNeolli-Medium', fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14), textAlign: 'center',
  },
  animalList: {
    position: 'absolute', top: scaleByDeviceWidth(25.5), left: scaleByDeviceWidth(120),
    flexDirection: 'row', alignItems: 'center',
  },
  animalSequence: { flexDirection: 'row', alignItems: 'center' },
  animalCard: {
    position: 'relative', width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: 'center',
  },
  tierBadge: {
    position: 'absolute', top: scaleByDeviceWidth(7), left: scaleByDeviceWidth(7.5),
    width: scaleByDeviceWidth(11.5), height: scaleByDeviceWidth(12),
    zIndex: 2,
  },
  typeBadge: {
    position: 'absolute', top: scaleByDeviceWidth(4), right: scaleByDeviceWidth(7),
    width: scaleByDeviceWidth(12.89), height: scaleByDeviceWidth(18.08),
    zIndex: 2,
  },
  animalImage: {
    position: 'absolute', top: scaleByDeviceWidth(18),
    width: scaleByDeviceWidth(44), height: scaleByDeviceWidth(44),
  },
  animalName: {
    position: 'absolute', right: scaleByDeviceWidth(4), bottom: scaleByDeviceWidth(10),
    left: scaleByDeviceWidth(4), color: '#403B34',
    fontFamily: 'EliceDXNeolli-Medium', fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14), textAlign: 'center',
  },
  arrow: {
    width: ARROW_WIDTH, height: ARROW_WIDTH * (26 / 32),
  },
});
