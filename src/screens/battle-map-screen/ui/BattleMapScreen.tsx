import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, { BounceIn } from 'react-native-reanimated';

import { useGymLeaders, type GymLeader } from '@/src/entities/battle';
import { useResumeBattle } from '@/src/features/resume-battle';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const BATTLE_MAP_SEGMENTS = [
  require('@/src/shared/assets/images/battle/battle-coach-map-1.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-2.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-3.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-4.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-5.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-6.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-7.png'),
  require('@/src/shared/assets/images/battle/battle-coach-map-8.png'),
] as const;

function isGymLeaderUnlocked(gymLeader: GymLeader) {
  return gymLeader.unlock?.unlocked ?? gymLeader.unlocked;
}
const COACH_SELECTED_EXCLAMATION = require('@/src/shared/assets/images/battle/coach-selected-exclamation.png');
const LOCKED_COACH_LEVEL_BACKGROUND = require('@/src/shared/assets/images/battle/locked-coach-level-background.png');
const MORU_COACH = require('@/src/shared/assets/images/battle/moru-coach.png');
const HARU_COACH = require('@/src/shared/assets/images/battle/haru-coach.png');
const HARU_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/haru-coach-silhouette.png');
const NIO_COACH = require('@/src/shared/assets/images/battle/nio-coach.png');
const NIO_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/nio-coach-silhouette.png');
const RAON_COACH = require('@/src/shared/assets/images/battle/raon-coach.png');
const RAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/raon-coach-silhouette.png');
const BYEOLI_COACH = require('@/src/shared/assets/images/battle/byeoli-coach.png');
const BYEOLI_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/byeoli-coach-silhouette.png');
const GAON_COACH = require('@/src/shared/assets/images/battle/gaon-coach.png');
const GAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/gaon-coach-silhouette.png');
const DAON_COACH = require('@/src/shared/assets/images/battle/daon-coach.png');
const DAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/daon-coach-silhouette.png');
const ION_COACH = require('@/src/shared/assets/images/battle/ion-coach.png');
const ION_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/ion-coach-silhouette.png');
const MAP_ORIGINAL_WIDTH = 1440;
const MAP_ORIGINAL_HEIGHT = 7672;
const MAP_SEGMENT_ORIGINAL_HEIGHT = 959;
const MORU_DESIGN_WIDTH = 360;
const MORU_CENTER_X = 720;
const MORU_TOP = 6810;
const MORU_TOP_OFFSET = 90;
const COACH_DESIGN_WIDTH = 380;
const COACH_SELECTION_DELAY = 700;
const EXCLAMATION_WIDTH = scaleByDeviceWidth(65.52);
const EXCLAMATION_HEIGHT = scaleByDeviceWidth(56.1);
const COACH_PLACEMENTS = [
  {
    id: 'moru',
    centerX: MORU_CENTER_X,
    top: MORU_TOP,
    image: MORU_COACH,
    silhouette: MORU_COACH,
  },
  {
    id: 'haru',
    centerX: 310,
    top: 5530,
    image: HARU_COACH,
    silhouette: HARU_COACH_SILHOUETTE,
  },
  {
    id: 'nio',
    centerX: 720,
    top: 4600,
    image: NIO_COACH,
    silhouette: NIO_COACH_SILHOUETTE,
  },
  {
    id: 'raon',
    centerX: 336,
    top: 3690,
    image: RAON_COACH,
    silhouette: RAON_COACH_SILHOUETTE,
  },
  {
    id: 'byeoli',
    centerX: 720,
    top: 2800,
    image: BYEOLI_COACH,
    silhouette: BYEOLI_COACH_SILHOUETTE,
  },
  {
    id: 'gaon',
    centerX: 1104,
    top: 1910,
    image: GAON_COACH,
    silhouette: GAON_COACH_SILHOUETTE,
  },
  {
    id: 'daon',
    centerX: 336,
    top: 1020,
    image: DAON_COACH,
    silhouette: DAON_COACH_SILHOUETTE,
  },
  {
    id: 'ion',
    centerX: 720,
    top: 100,
    image: ION_COACH,
    silhouette: ION_COACH_SILHOUETTE,
  },
] as const;

export function BattleMapScreen() {
  const mapListRef = useRef<FlatList<number>>(null);
  const hasPositionedInitialScrollRef = useRef(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);
  const [selectedGymLeaderId, setSelectedGymLeaderId] = useState<number | null>(
    null,
  );
  const { gymLeaders, reload } = useGymLeaders();
  const {
    clearBattleSession,
    clearError: clearResumeBattleError,
    errorMessage: resumeBattleErrorMessage,
    isLoading: isResumingBattle,
    resumeBattle,
  } = useResumeBattle();
  const mapHeight = screenWidth * (MAP_ORIGINAL_HEIGHT / MAP_ORIGINAL_WIDTH);
  const moruWidth = screenWidth * (MORU_DESIGN_WIDTH / MAP_ORIGINAL_WIDTH);
  const moruTop =
    mapHeight * (MORU_TOP / MAP_ORIGINAL_HEIGHT) -
    screenWidth * (MORU_TOP_OFFSET / 360);
  const coachWidth = screenWidth * (COACH_DESIGN_WIDTH / MAP_ORIGINAL_WIDTH);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      hasPositionedInitialScrollRef.current = false;
      setSelectedGymLeaderId(null);
      void reload();
      void resumeBattle().then(async (resumedBattle) => {
        if (!isActive || !resumedBattle?.session) {
          return;
        }

        const { session, state } = resumedBattle;

        if (state.status === 'ABANDONED') {
          await clearBattleSession();
          return;
        }

        if (!isActive) {
          return;
        }

        if (state.status === 'FINISHED') {
          await clearBattleSession();

          if (!isActive) {
            return;
          }

          router.replace({
            pathname: '/battle-result',
            params: {
              battleId: String(state.battleId),
              battleResult: state.result ?? undefined,
              coach: session.coach,
              gymLeaderId: String(state.gymLeaderId),
              npcParty: session.npcParty,
              party: session.party,
              reward: state.reward
                ? JSON.stringify(state.reward)
                : undefined,
            },
          });
          return;
        }

        router.replace({
          pathname: '/battle-arena',
          params: {
            battleId: String(state.battleId),
            coach: session.coach,
            initialBattleState: JSON.stringify(state),
            npcParty: session.npcParty,
            party: session.party,
          },
        });
      });

      return () => {
        isActive = false;

        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }, [clearBattleSession, reload, resumeBattle]),
  );

  useEffect(() => {
    if (
      hasPositionedInitialScrollRef.current ||
      screenWidth <= 0 ||
      screenHeight <= 0 ||
      gymLeaders.length === 0
    ) {
      return;
    }

    const unclearedLeaders = gymLeaders.filter(
      (gymLeader) => !gymLeader.cleared,
    );
    const targetGymLeader =
      unclearedLeaders
        .filter(isGymLeaderUnlocked)
        .sort(
          (firstLeader, secondLeader) =>
            secondLeader.challengeOrder - firstLeader.challengeOrder,
        )[0] ??
      unclearedLeaders.sort(
        (firstLeader, secondLeader) =>
          secondLeader.challengeOrder - firstLeader.challengeOrder,
      )[0];

    if (!targetGymLeader) {
      mapListRef.current?.scrollToEnd({ animated: false });
      hasPositionedInitialScrollRef.current = true;
      return;
    }

    const coach = COACH_PLACEMENTS[targetGymLeader.challengeOrder - 1];
    if (!coach) {
      return;
    }

    const coachTop =
      targetGymLeader.challengeOrder === 1
        ? moruTop
        : mapHeight * (coach.top / MAP_ORIGINAL_HEIGHT);
    const coachSize =
      targetGymLeader.challengeOrder === 1 ? moruWidth : coachWidth;
    const maximumScrollY = Math.max(0, mapHeight - screenHeight);
    const targetScrollY = Math.min(
      maximumScrollY,
      Math.max(0, coachTop + coachSize / 2 - screenHeight / 2),
    );

    hasPositionedInitialScrollRef.current = true;
    mapListRef.current?.scrollToOffset({
      animated: false,
      offset: targetScrollY,
    });
  }, [
    coachWidth,
    gymLeaders,
    mapHeight,
    moruTop,
    moruWidth,
    screenHeight,
    screenWidth,
  ]);

  const handleGymLeaderPress = (gymLeader: GymLeader) => {
    if (
      selectedGymLeaderId !== null ||
      !isGymLeaderUnlocked(gymLeader) ||
      isResumingBattle
    ) {
      return;
    }

    setSelectedGymLeaderId(gymLeader.gymLeaderId);
    navigationTimeoutRef.current = setTimeout(() => {
      navigationTimeoutRef.current = null;
      setSelectedGymLeaderId(null);
      router.push({
        pathname: '/battle-ready',
        params: {
          coach: COACH_PLACEMENTS[gymLeader.challengeOrder - 1]?.id ?? 'moru',
          gymLeaderId: String(gymLeader.gymLeaderId),
          gymLeaderName: gymLeader.name,
        },
      });
    }, COACH_SELECTION_DELAY);
  };

  return (
    <View
      onLayout={(event) => {
        const { height: nextHeight, width: nextWidth } =
          event.nativeEvent.layout;

        if (nextWidth !== screenWidth) {
          setScreenWidth(nextWidth);
        }
        if (nextHeight !== screenHeight) {
          setScreenHeight(nextHeight);
        }
      }}
      style={styles.screen}
    >
      {screenWidth > 0 && (
        <FlatList
          bounces={false}
          data={BATTLE_MAP_SEGMENTS.map((_, index) => index)}
          getItemLayout={(_, index) => {
            const segmentHeight =
              screenWidth *
              (MAP_SEGMENT_ORIGINAL_HEIGHT / MAP_ORIGINAL_WIDTH);

            return {
              index,
              length: segmentHeight,
              offset: index * segmentHeight,
            };
          }}
          initialNumToRender={3}
          keyExtractor={String}
          maxToRenderPerBatch={2}
          ref={mapListRef}
          removeClippedSubviews={false}
          renderItem={({ index }) => {
            const segmentHeight =
              screenWidth *
              (MAP_SEGMENT_ORIGINAL_HEIGHT / MAP_ORIGINAL_WIDTH);
            const segmentTop = index * segmentHeight;
            const containsSelectedCoach = gymLeaders.some((gymLeader) => {
              if (gymLeader.gymLeaderId !== selectedGymLeaderId) {
                return false;
              }

              const coach =
                COACH_PLACEMENTS[gymLeader.challengeOrder - 1];

              if (!coach) {
                return false;
              }

              const coachTop =
                gymLeader.challengeOrder === 1
                  ? moruTop
                  : mapHeight * (coach.top / MAP_ORIGINAL_HEIGHT);

              return (
                coachTop >= segmentTop &&
                coachTop < segmentTop + segmentHeight
              );
            });

            return (
              <View
                style={[
                  styles.mapSegment,
                  {
                    width: screenWidth,
                    height: segmentHeight,
                    // 선택 시 배경을 올리면 이전 조각에서 내려온 관장이 가려진다.
                    zIndex: containsSelectedCoach
                      ? BATTLE_MAP_SEGMENTS.length + 1
                      : BATTLE_MAP_SEGMENTS.length - index,
                  },
                ]}
              >
                <Image
                  resizeMode="stretch"
                  source={BATTLE_MAP_SEGMENTS[index]}
                  style={styles.mapSegmentImage}
                />
                {gymLeaders.map((gymLeader) => {
                  const coach =
                    COACH_PLACEMENTS[gymLeader.challengeOrder - 1];

                  if (!coach) {
                    return null;
                  }

                  const coachTop =
                    gymLeader.challengeOrder === 1
                      ? moruTop
                      : mapHeight * (coach.top / MAP_ORIGINAL_HEIGHT);

                  if (
                    coachTop < segmentTop ||
                    coachTop >= segmentTop + segmentHeight
                  ) {
                    return null;
                  }

                  const isSelected =
                    selectedGymLeaderId === gymLeader.gymLeaderId;
                  const isUnlocked = isGymLeaderUnlocked(gymLeader);
                  const requiredLevel = gymLeader.unlock?.requiredLevel;
                  const size =
                    gymLeader.challengeOrder === 1 ? moruWidth : coachWidth;
                  const left =
                    screenWidth * (coach.centerX / MAP_ORIGINAL_WIDTH) -
                    size / 2;

                  return (
                    <Pressable
                      accessibilityLabel={
                        isUnlocked
                          ? `${gymLeader.challengeOrder}번째 관장 ${gymLeader.name}에게 도전하기`
                          : `잠긴 ${gymLeader.challengeOrder}번째 관장 ${gymLeader.name}, 요구 레벨 ${requiredLevel ?? '알 수 없음'}`
                      }
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: !isUnlocked,
                        selected: isSelected,
                      }}
                      disabled={
                        !isUnlocked ||
                        selectedGymLeaderId !== null ||
                        isResumingBattle
                      }
                      key={gymLeader.gymLeaderId}
                      onPress={() => handleGymLeaderPress(gymLeader)}
                      style={({ pressed }) => [
                        styles.coachButton,
                        {
                          top: coachTop - segmentTop,
                          left,
                          width: size,
                          height: size,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <ExpoImage
                        cachePolicy="memory-disk"
                        contentFit="contain"
                        source={
                          isUnlocked
                            ? gymLeader.thumbnailUrl
                              ? { uri: gymLeader.thumbnailUrl }
                              : coach.image
                            : coach.silhouette
                        }
                        style={styles.coachImage}
                      />
                      {!isUnlocked && (
                        <>
                          <Text style={styles.lockedCoachQuestionMark}>?</Text>
                          <ImageBackground
                            resizeMode="stretch"
                            source={LOCKED_COACH_LEVEL_BACKGROUND}
                            style={styles.lockedCoachRequiredLevelBackground}
                          >
                            <Text style={styles.lockedCoachRequiredLevel}>
                              Lv.{requiredLevel ?? '??'}
                            </Text>
                          </ImageBackground>
                        </>
                      )}
                      {isSelected && (
                        <View
                          style={styles.coachSelectedExclamationPosition}
                        >
                          <Animated.View entering={BounceIn.duration(350)}>
                            <Image
                              resizeMode="contain"
                              source={COACH_SELECTED_EXCLAMATION}
                              style={styles.coachSelectedExclamation}
                            />
                          </Animated.View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          windowSize={3}
        />
      )}
      <ErrorModal
        message={resumeBattleErrorMessage}
        onClose={clearResumeBattleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  coachButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mapSegment: {
    position: 'relative',
    overflow: 'visible',
  },
  mapSegmentImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coachImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lockedCoachQuestionMark: {
    color: '#FFFFFF',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(21),
    textAlign: 'center',
  },
  lockedCoachRequiredLevelBackground: {
    position: 'absolute',
    bottom: -scaleByDeviceWidth(1),
    width: scaleByDeviceWidth(50),
    height: scaleByDeviceWidth(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCoachRequiredLevel: {
    color: '#FFFFFF',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(14),
    textAlign: 'center',
  },
  coachSelectedExclamationPosition: {
    position: 'absolute',
    top: -scaleByDeviceWidth(42),
    left: '50%',
    transform: [{ translateX: -EXCLAMATION_WIDTH / 2 }],
  },
  coachSelectedExclamation: {
    width: EXCLAMATION_WIDTH,
    height: EXCLAMATION_HEIGHT,
  },
  pressed: {
    opacity: 0.8,
  },
});
