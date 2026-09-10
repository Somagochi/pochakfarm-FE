import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';

import { useGymLeaders, type GymLeader } from '@/src/entities/battle';
import { useResumeBattle } from '@/src/features/resume-battle';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BATTLE_MAP = require('@/src/shared/assets/images/battle/battle-coach-map.png');
const COACH_SELECTED_EXCLAMATION = require('@/src/shared/assets/images/battle/coach-selected-exclamation.png');
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
const MAP_ORIGINAL_HEIGHT = 7648;
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
  const scrollViewRef = useRef<ScrollView>(null);
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
    if (!resumeBattleErrorMessage) {
      return;
    }

    clearResumeBattleError();
    Alert.alert('대전 복구 실패', resumeBattleErrorMessage);
  }, [clearResumeBattleError, resumeBattleErrorMessage]);

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
        .filter((gymLeader) => gymLeader.unlocked)
        .sort(
          (firstLeader, secondLeader) =>
            secondLeader.challengeOrder - firstLeader.challengeOrder,
        )[0] ??
      unclearedLeaders.sort(
        (firstLeader, secondLeader) =>
          secondLeader.challengeOrder - firstLeader.challengeOrder,
      )[0];

    if (!targetGymLeader) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
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
    scrollViewRef.current?.scrollTo({
      animated: false,
      y: targetScrollY,
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
      !gymLeader.unlocked ||
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
        <ScrollView
          bounces={false}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            resizeMode="contain"
            source={BATTLE_MAP}
            style={{ width: screenWidth, height: mapHeight }}
          >
            {gymLeaders.map((gymLeader) => {
              const coach = COACH_PLACEMENTS[gymLeader.challengeOrder - 1];

              if (!coach) {
                return null;
              }

              const isSelected = selectedGymLeaderId === gymLeader.gymLeaderId;
              const isUnlocked = gymLeader.unlocked;
              const left =
                screenWidth * (coach.centerX / MAP_ORIGINAL_WIDTH) -
                (gymLeader.challengeOrder === 1 ? moruWidth : coachWidth) / 2;
              const top =
                gymLeader.challengeOrder === 1
                  ? moruTop
                  : mapHeight * (coach.top / MAP_ORIGINAL_HEIGHT);
              const size =
                gymLeader.challengeOrder === 1 ? moruWidth : coachWidth;

              return (
                <Pressable
                  accessibilityLabel={
                    isUnlocked
                      ? `${gymLeader.challengeOrder}번째 관장 ${gymLeader.name}에게 도전하기`
                      : `잠긴 ${gymLeader.challengeOrder}번째 관장 ${gymLeader.name}`
                  }
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isUnlocked, selected: isSelected }}
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
                      top,
                      left,
                      width: size,
                      height: size,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    resizeMode="contain"
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
                    <Text style={styles.lockedCoachQuestionMark}>?</Text>
                  )}
                  {isSelected && (
                    <View style={styles.coachSelectedExclamationPosition}>
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
          </ImageBackground>
        </ScrollView>
      )}
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
