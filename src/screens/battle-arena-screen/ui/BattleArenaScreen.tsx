import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  getBattleArenaType,
  isBattleCoachId,
  type BattleArenaType,
} from '@/src/entities/battle';
import type { CreatureEnvironment } from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const ARENA_BACKGROUNDS: Record<BattleArenaType, number> = {
  ground: require('@/src/shared/assets/images/battle/ground-arena-background.png'),
  sky: require('@/src/shared/assets/images/battle/sky-arena-background.png'),
  sea: require('@/src/shared/assets/images/battle/sea-arena-background.png'),
  space: require('@/src/shared/assets/images/battle/space-arena-background.png'),
};
const BATTLE_LOG_PANEL = require('@/src/shared/assets/images/battle/battle-log-panel.png');
const BATTLE_LOG_TITLE = require('@/src/shared/assets/images/battle/battle-log-title.png');
const BATTLE_LOG_LEFT_BUBBLE = require('@/src/shared/assets/images/battle/battle-log-left-bubble.png');
const BATTLE_LOG_RIGHT_BUBBLE = require('@/src/shared/assets/images/battle/battle-log-right-bubble.png');
const BATTLE_PROGRESS_BAR = require('@/src/shared/assets/images/battle/battle-progress-bar.png');
const BATTLE_PROGRESS_FILL = require('@/src/shared/assets/images/battle/battle-progress-fill.png');
const BATTLE_STATUS_BADGE = require('@/src/shared/assets/images/battle/battle-status-badge.png');
const BATTLE_ROUND_LABEL = require('@/src/shared/assets/images/battle/battle-round-label.png');
const OPPONENT_CREATURE = require('@/src/shared/assets/images/farm/kkomi.png');
const CREATURE_INFO_CARD = require('@/src/shared/assets/images/battle/creature-info-card.png');
const BALANCE_SKILL_TYPE = require('@/src/shared/assets/images/battle/balance-skill-type.png');
const COMPETITIVE_SKILL_TYPE = require('@/src/shared/assets/images/battle/competitive-skill-type.png');
const STABLE_SKILL_TYPE = require('@/src/shared/assets/images/battle/stable-skill-type.png');
const CHEER_BUTTON = require('@/src/shared/assets/images/battle/cheer-button.png');
const BATTLE_LOG_COUNT = 4;
const BATTLE_PROGRESS_INNER_WIDTH = scaleByDeviceWidth(310);
const BATTLE_PROGRESS_FILL_WIDTH = scaleByDeviceWidth(310);
const BATTLE_PROGRESS_FILL_HEIGHT = scaleByDeviceWidth(26);
const BATTLE_PROGRESS_FILL_IMAGE_WIDTH =
  BATTLE_PROGRESS_FILL_WIDTH * (2020 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_HEIGHT =
  BATTLE_PROGRESS_FILL_HEIGHT * (778 / 144);
const BATTLE_PROGRESS_FILL_IMAGE_LEFT =
  -BATTLE_PROGRESS_FILL_WIDTH * (74 / 1872);
const BATTLE_PROGRESS_FILL_IMAGE_TOP =
  -BATTLE_PROGRESS_FILL_HEIGHT * (303 / 144);
const BATTLE_STATUS_BADGE_SIZE = scaleByDeviceWidth(62);
const FINAL_CLASH_DURATION_MS = 6000;

type BattlePartyMember = {
  environment: CreatureEnvironment;
  id: string;
  imageUri?: string;
  name: string;
};

const TYPE_BADGES: Record<CreatureEnvironment, number> = {
  land: require('@/src/shared/assets/images/farm-search/land-badge.png'),
  sky: require('@/src/shared/assets/images/farm-search/sky-badge.png'),
  sea: require('@/src/shared/assets/images/farm-search/sea-badge.png'),
  space: require('@/src/shared/assets/images/farm-search/space-badge.png'),
};

const SKILLS_BY_ENVIRONMENT: Record<CreatureEnvironment, [string, string]> = {
  land: ['균형잡기', '몸통박치기'],
  sky: ['바람돌진', '구름 숨기'],
  sea: ['물결타기', '진주 방패'],
  space: ['별빛파동', '중력 뒤집기'],
};

function parseParty(value?: string | string[]): BattlePartyMember[] {
  const serializedParty = Array.isArray(value) ? value[0] : value;

  if (!serializedParty) {
    return [];
  }

  try {
    const parsedParty: unknown = JSON.parse(serializedParty);

    if (!Array.isArray(parsedParty)) {
      return [];
    }

    return parsedParty.filter(
      (member): member is BattlePartyMember =>
        typeof member === 'object' &&
        member !== null &&
        'id' in member &&
        typeof member.id === 'string' &&
        'name' in member &&
        typeof member.name === 'string' &&
        'environment' in member &&
        ['land', 'sky', 'sea', 'space'].includes(String(member.environment)),
    );
  } catch {
    return [];
  }
}

type CreatureInfoCardProps = {
  environment: CreatureEnvironment;
  isOpponent?: boolean;
  name: string;
};

function CreatureInfoCard({
  environment,
  isOpponent = false,
  name,
}: CreatureInfoCardProps) {
  const skills = SKILLS_BY_ENVIRONMENT[environment];
  const skillTypeSources = isOpponent
    ? [STABLE_SKILL_TYPE, BALANCE_SKILL_TYPE]
    : [BALANCE_SKILL_TYPE, COMPETITIVE_SKILL_TYPE];

  return (
    <ImageBackground
      resizeMode="stretch"
      source={CREATURE_INFO_CARD}
      style={[
        styles.creatureInfoCard,
        isOpponent ? styles.opponentInfo : styles.playerInfo,
      ]}
    >
      <Text numberOfLines={1} style={styles.creatureName}>{name}</Text>
      <Image
        resizeMode="contain"
        source={TYPE_BADGES[environment]}
        style={styles.typeBadge}
      />
      {skills.map((skill, index) => (
        <View key={skill} style={[styles.skillRow, index === 0 ? styles.firstSkillRow : styles.secondSkillRow]}>
          <Text style={styles.skillName}>{skill}</Text>
          <Image
            resizeMode="contain"
            source={skillTypeSources[index]}
            style={styles.skillType}
          />
        </View>
      ))}
    </ImageBackground>
  );
}

export function BattleArenaScreen() {
  const logScrollViewRef = useRef<ScrollView>(null);
  const battleProgress = useSharedValue(0.5);
  const finalClashProgress = useSharedValue(0.5);
  const { coach, party } = useLocalSearchParams<{
    coach?: string | string[];
    party?: string | string[];
  }>();
  const coachParam = Array.isArray(coach) ? coach[0] : coach;
  const coachId = coachParam && isBattleCoachId(coachParam) ? coachParam : 'moru';
  const [arenaType] = useState(() => getBattleArenaType(coachId));
  const [partyMembers] = useState(() => parseParty(party));
  const [round, setRound] = useState(1);
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [isFinalClashVisible, setIsFinalClashVisible] = useState(false);
  const fallbackPlayer = {
    environment: 'land' as const,
    id: 'preview-player',
    name: '다라미',
  };
  const player = partyMembers[round - 1] ?? partyMembers[0] ?? fallbackPlayer;
  const opponent = {
    environment: 'sky' as const,
    name: '꼬미우르스야',
  };
  const playerSkills = SKILLS_BY_ENVIRONMENT[player.environment];
  const battleLogs = [
    {
      message: `${player.name}(이)가 타입 상성에서 유리합니다!`,
      side: 'player',
    },
    {
      message: `${player.name}(이)가 선공권을 가져갑니다!`,
      side: 'player',
    },
    {
      message: `${player.name}의 ${playerSkills[0]}이(가) 발동했어요!`,
      side: 'player',
    },
    {
      message: `${opponent.name}의 구름 숨기는 발동하지 않았어요.`,
      side: 'opponent',
    },
  ];

  useEffect(() => {
    setVisibleLogCount(0);

    const logTimers = Array.from({ length: BATTLE_LOG_COUNT }, (_, index) =>
      setTimeout(() => setVisibleLogCount(index + 1), 300 + index * 1000),
    );

    return () => logTimers.forEach(clearTimeout);
  }, [round]);

  useEffect(() => {
    if (visibleLogCount === 3) {
      battleProgress.value = withTiming(
        Math.min(0.92, battleProgress.value + 0.2),
        { duration: 650 },
      );
    } else if (visibleLogCount === 4) {
      battleProgress.value = withTiming(
        Math.max(0.08, battleProgress.value - 0.15),
        { duration: 650 },
      );
    }
  }, [battleProgress, visibleLogCount]);

  const battleProgressStyle = useAnimatedStyle(() => ({
    width: BATTLE_PROGRESS_FILL_WIDTH * battleProgress.value,
  }));
  const battleStatusBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          BATTLE_PROGRESS_INNER_WIDTH * battleProgress.value -
          BATTLE_STATUS_BADGE_SIZE / 2,
      },
    ],
  }));
  const finalClashProgressStyle = useAnimatedStyle(() => ({
    width: BATTLE_PROGRESS_FILL_WIDTH * finalClashProgress.value,
  }));
  const finalClashStatusBadgeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          BATTLE_PROGRESS_INNER_WIDTH * finalClashProgress.value -
          BATTLE_STATUS_BADGE_SIZE / 2,
      },
    ],
  }));

  useEffect(() => {
    const roundTimer = setTimeout(() => {
      if (round < 3) {
        setRound((currentRound) => currentRound + 1);
        return;
      }

      setIsFinalClashVisible(true);
    }, 4000);

    return () => clearTimeout(roundTimer);
  }, [coachId, party, round]);

  useEffect(() => {
    if (!isFinalClashVisible) {
      return;
    }

    finalClashProgress.value = battleProgress.value;

    const finalClashTimer = setTimeout(() => {
      router.replace({
        pathname: '/battle-result',
        params: {
          coach: coachId,
          party: typeof party === 'string' ? party : party?.[0],
        },
      });
    }, FINAL_CLASH_DURATION_MS);

    return () => clearTimeout(finalClashTimer);
  }, [battleProgress, coachId, finalClashProgress, isFinalClashVisible, party]);

  const handleCheerPress = () => {
    finalClashProgress.value = withTiming(
      Math.min(0.92, finalClashProgress.value + 0.035),
      { duration: 100 },
    );
  };

  return (
    <ImageBackground
      accessibilityLabel={`${arenaType} 타입 대전 경기장`}
      resizeMode="cover"
      source={ARENA_BACKGROUNDS[arenaType]}
      style={styles.screen}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <ImageBackground
            resizeMode="stretch"
            source={BATTLE_ROUND_LABEL}
            style={styles.roundLabel}
          >
            <Text style={styles.roundText}>{round}라운드</Text>
          </ImageBackground>

          <View style={styles.battleField}>
            <CreatureInfoCard
              environment={opponent.environment}
              isOpponent
              name={opponent.name}
            />
            <Image resizeMode="contain" source={OPPONENT_CREATURE} style={styles.opponentCreature} />
            <Image
              resizeMode="contain"
              source={player.imageUri ? { uri: player.imageUri } : OPPONENT_CREATURE}
              style={styles.playerCreature}
            />
            <CreatureInfoCard environment={player.environment} name={player.name} />
          </View>

          <View accessibilityLabel="결투 진행도" style={styles.statusBar}>
            <Image
              resizeMode="stretch"
              source={BATTLE_PROGRESS_BAR}
              style={styles.battleProgressFrame}
            />
            <Animated.View style={[styles.battleProgressFill, battleProgressStyle]}>
              <Image
                resizeMode="stretch"
                source={BATTLE_PROGRESS_FILL}
                style={styles.battleProgressFillImage}
              />
            </Animated.View>
            <Animated.Image
              resizeMode="contain"
              source={BATTLE_STATUS_BADGE}
              style={[styles.battleStatusBadge, battleStatusBadgeStyle]}
            />
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.logRegionContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.logRegionScroll}
          >
            <ImageBackground
              resizeMode="stretch"
              source={BATTLE_LOG_PANEL}
              style={styles.logPanel}
            >
              <Image resizeMode="contain" source={BATTLE_LOG_TITLE} style={styles.logTitle} />
              <ScrollView
                contentContainerStyle={styles.logContent}
                nestedScrollEnabled
                onContentSizeChange={() =>
                  logScrollViewRef.current?.scrollToEnd({ animated: true })
                }
                ref={logScrollViewRef}
                showsVerticalScrollIndicator
                style={styles.logScroll}
              >
                {battleLogs.slice(0, visibleLogCount).map((log, index) => (
                  <ImageBackground
                    key={`${round}-${index}-${log.message}`}
                    resizeMode="stretch"
                    source={
                      log.side === 'player'
                        ? BATTLE_LOG_LEFT_BUBBLE
                        : BATTLE_LOG_RIGHT_BUBBLE
                    }
                    style={[
                      styles.logBubble,
                      log.side === 'player'
                        ? styles.playerLogBubble
                        : styles.opponentLogBubble,
                    ]}
                  >
                    <Text numberOfLines={2} style={styles.logText}>{log.message}</Text>
                  </ImageBackground>
                ))}
              </ScrollView>
            </ImageBackground>
          </ScrollView>
        </View>
      </SafeAreaView>
      {isFinalClashVisible && (
        <View style={styles.finalClashOverlay}>
          <View style={styles.finalClashContent}>
            <Text style={styles.finalClashTitle}>마지막 승부!</Text>
            <Text style={styles.finalClashDescription}>
              버튼을 연타해서 승부를 결판지어보세요!
            </Text>
            <View accessibilityLabel="마지막 승부 진행도" style={styles.finalClashProgressBar}>
              <Image
                resizeMode="stretch"
                source={BATTLE_PROGRESS_BAR}
                style={styles.battleProgressFrame}
              />
              <Animated.View style={[styles.battleProgressFill, finalClashProgressStyle]}>
                <Image
                  resizeMode="stretch"
                  source={BATTLE_PROGRESS_FILL}
                  style={styles.battleProgressFillImage}
                />
              </Animated.View>
              <Animated.Image
                resizeMode="contain"
                source={BATTLE_STATUS_BADGE}
                style={[styles.battleStatusBadge, finalClashStatusBadgeStyle]}
              />
            </View>
            <Pressable
              accessibilityLabel="응원하기"
              accessibilityRole="button"
              onPress={handleCheerPress}
              style={({ pressed }) => [
                styles.cheerButton,
                pressed && styles.cheerButtonPressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={CHEER_BUTTON}
                style={styles.cheerButtonImage}
              />
            </Pressable>
            <Text style={styles.cheerButtonLabel}>응원하기</Text>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(8),
    paddingBottom: scaleByDeviceWidth(8),
  },
  roundLabel: {
    width: scaleByDeviceWidth(89.33),
    height: scaleByDeviceWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    color: '#3E352B',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(19),
  },
  battleField: {
    position: 'relative',
    width: '100%',
    height: scaleByDeviceWidth(324),
  },
  creatureInfoCard: {
    position: 'absolute',
    width: scaleByDeviceWidth(131.25),
    height: scaleByDeviceWidth(95.5),
  },
  opponentInfo: {
    top: scaleByDeviceWidth(18),
    left: scaleByDeviceWidth(25),
  },
  playerInfo: {
    right: scaleByDeviceWidth(24),
    bottom: scaleByDeviceWidth(13),
  },
  creatureName: {
    position: 'absolute',
    top: scaleByDeviceWidth(17),
    left: scaleByDeviceWidth(14),
    right: scaleByDeviceWidth(32),
    color: '#32322D',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(13),
  },
  typeBadge: {
    position: 'absolute',
    top: 0,
    right: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(24),
    height: scaleByDeviceWidth(33),
  },
  skillRow: {
    position: 'absolute',
    left: scaleByDeviceWidth(19),
    right: scaleByDeviceWidth(17),
    height: scaleByDeviceWidth(17),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  firstSkillRow: {
    top: scaleByDeviceWidth(45),
  },
  secondSkillRow: {
    top: scaleByDeviceWidth(66),
  },
  skillName: {
    color: '#655742',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(8),
    lineHeight: scaleByDeviceWidth(11),
  },
  skillType: {
    width: scaleByDeviceWidth(29),
    height: scaleByDeviceWidth(12),
  },
  opponentCreature: {
    position: 'absolute',
    top: scaleByDeviceWidth(34),
    right: scaleByDeviceWidth(35),
    width: scaleByDeviceWidth(108),
    height: scaleByDeviceWidth(108),
  },
  playerCreature: {
    position: 'absolute',
    left: scaleByDeviceWidth(24),
    bottom: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(132),
    height: scaleByDeviceWidth(132),
  },
  statusBar: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(54),
  },
  battleProgressFill: {
    position: 'absolute',
    top: '50%',
    left: scaleByDeviceWidth(13),
    height: BATTLE_PROGRESS_FILL_HEIGHT,
    overflow: 'hidden',
    transform: [
      {
        translateY:
          -BATTLE_PROGRESS_FILL_HEIGHT / 2 - scaleByDeviceWidth(1),
      },
    ],
  },
  battleProgressFillImage: {
    position: 'absolute',
    top: BATTLE_PROGRESS_FILL_IMAGE_TOP,
    left: BATTLE_PROGRESS_FILL_IMAGE_LEFT,
    width: BATTLE_PROGRESS_FILL_IMAGE_WIDTH,
    height: BATTLE_PROGRESS_FILL_IMAGE_HEIGHT,
  },
  battleProgressFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  battleStatusBadge: {
    position: 'absolute',
    top: scaleByDeviceWidth(-4),
    left: scaleByDeviceWidth(13),
    width: BATTLE_STATUS_BADGE_SIZE,
    height: BATTLE_STATUS_BADGE_SIZE,
  },
  finalClashOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    zIndex: 10,
  },
  finalClashContent: {
    alignItems: 'center',
  },
  finalClashTitle: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  finalClashDescription: {
    marginTop: scaleByDeviceWidth(8),
    color: '#BDB8AD',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  finalClashProgressBar: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(54),
    marginTop: scaleByDeviceWidth(27.27),
  },
  cheerButton: {
    width: scaleByDeviceWidth(96),
    height: scaleByDeviceWidth(96),
    marginTop: scaleByDeviceWidth(64),
  },
  cheerButtonImage: {
    width: '100%',
    height: '100%',
  },
  cheerButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  cheerButtonLabel: {
    marginTop: scaleByDeviceWidth(8),
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(16),
    lineHeight: scaleByDeviceWidth(22),
  },
  logPanel: {
    position: 'relative',
    width: scaleByDeviceWidth(336),
    height: scaleByDeviceWidth(306),
    paddingTop: scaleByDeviceWidth(42),
    paddingHorizontal: scaleByDeviceWidth(20),
    paddingBottom: scaleByDeviceWidth(18),
  },
  logRegionScroll: {
    flex: 1,
    width: '100%',
  },
  logRegionContent: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(20),
    paddingBottom: scaleByDeviceWidth(8),
  },
  logTitle: {
    position: 'absolute',
    top: scaleByDeviceWidth(-15),
    left: scaleByDeviceWidth(104),
    width: scaleByDeviceWidth(128),
    height: scaleByDeviceWidth(32),
  },
  logScroll: {
    flex: 1,
  },
  logContent: {
    gap: scaleByDeviceWidth(10),
    paddingRight: scaleByDeviceWidth(3),
  },
  logBubble: {
    width: scaleByDeviceWidth(290),
    height: scaleByDeviceWidth(54),
    justifyContent: 'center',
    paddingHorizontal: scaleByDeviceWidth(22),
  },
  playerLogBubble: {
    alignSelf: 'flex-start',
  },
  opponentLogBubble: {
    alignSelf: 'flex-end',
  },
  logText: {
    color: '#725E42',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(14),
  },
});
