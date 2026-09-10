import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GymLeaderDetailCard,
  isBattleCoachId,
  useGymLeaderDetail,
} from '@/src/entities/battle';
import type {
  AnimalCardType,
  CreatureEnvironment,
  FarmCreatureListItem,
} from '@/src/entities/creature';
import { useUserProfile } from '@/src/entities/user';
import { useCreateBattle } from '@/src/features/create-battle';
import { useResumeBattle } from '@/src/features/resume-battle';
import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { ApiError } from '@/src/shared/api/client';
import { BattleHeader } from '@/src/widgets/battle-header';
import { BattleMatchSelection } from '@/src/widgets/battle-match-selection';

const MORU_RECOMMENDED_ENVIRONMENTS: readonly CreatureEnvironment[] = [
  'land',
  'sea',
];
const LEGACY_ACTIVE_BATTLE_ID = 4;
const ENVIRONMENT_BY_CARD_TYPE: Record<
  AnimalCardType,
  CreatureEnvironment
> = {
  GROUND: 'land',
  SEA: 'sea',
  SKY: 'sky',
  SPACE: 'space',
};
const ENVIRONMENT_BY_SUGGEST_TYPE: Record<string, CreatureEnvironment> = {
  ...ENVIRONMENT_BY_CARD_TYPE,
  '땅': 'land',
  '바다': 'sea',
  '하늘': 'sky',
  '우주': 'space',
};

export function BattleScreen() {
  const params = useLocalSearchParams<{
    coach?: string | string[];
    gymLeaderCode?: string | string[];
    gymLeaderId?: string | string[];
    gymLeaderName?: string | string[];
  }>();
  const gymLeaderIdParam = Array.isArray(params.gymLeaderId)
    ? params.gymLeaderId[0]
    : params.gymLeaderId;
  const parsedGymLeaderId = Number(gymLeaderIdParam);
  const gymLeaderId =
    gymLeaderIdParam &&
    Number.isSafeInteger(parsedGymLeaderId) &&
    parsedGymLeaderId > 0
      ? parsedGymLeaderId
      : undefined;
  const coachParam = Array.isArray(params.coach)
    ? params.coach[0]
    : params.coach;
  const coach = coachParam && isBattleCoachId(coachParam) ? coachParam : 'moru';
  const { errorMessage, gymLeaderDetail, isLoading, reload } =
    useGymLeaderDetail(gymLeaderId);
  const { profile } = useUserProfile();
  const {
    clearError: clearCreateBattleError,
    createBattle,
    getLastError: getCreateBattleError,
    isLoading: isCreatingBattle,
  } = useCreateBattle();
  const {
    clearBattleSession,
    clearError: clearResumeBattleError,
    errorMessage: resumeBattleErrorMessage,
    isLoading: isResumingBattle,
    resumeBattle,
    saveBattleSession,
  } = useResumeBattle();
  const [selectedCreatures, setSelectedCreatures] = useState<
    FarmCreatureListItem[]
  >([]);
  const [creatureListRefreshKey, setCreatureListRefreshKey] = useState(0);
  const [battleStartErrorMessage, setBattleStartErrorMessage] = useState<
    string | null
  >(null);
  const recommendedCreatureEnvironments = useMemo(() => {
    if (!gymLeaderDetail) {
      return MORU_RECOMMENDED_ENVIRONMENTS;
    }

    const suggestType = gymLeaderDetail.gymLeader.suggestType;
    const suggestedEnvironment = suggestType
      ? ENVIRONMENT_BY_SUGGEST_TYPE[suggestType]
      : undefined;

    return suggestedEnvironment ? [suggestedEnvironment] : [];
  }, [gymLeaderDetail]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setSelectedCreatures([]);
      setCreatureListRefreshKey((currentKey) => currentKey + 1);
      void reload();

      void resumeBattle().then(async (resumedBattle) => {
        if (!isActive || !resumedBattle) {
          return;
        }

        const { session, state } = resumedBattle;

        if (!session) {
          return;
        }

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
      };
    }, [clearBattleSession, reload, resumeBattle]),
  );

  const handleStartBattle = async () => {
    if (!gymLeaderDetail || selectedCreatures.length !== 3) {
      return;
    }

    const entries = selectedCreatures.map((creature, index) => ({
      animalId: Number(creature.id),
      orderNo: index + 1,
    }));

    if (entries.some((entry) => !Number.isSafeInteger(entry.animalId))) {
      setBattleStartErrorMessage('출전 동물 정보가 올바르지 않습니다.');
      return;
    }

    const serializedSelectedParty = JSON.stringify(
      selectedCreatures.map((creature, index) => ({
        environment: creature.environment,
        id: creature.id,
        imageUri: creature.creatureImageUri,
        name: creature.name,
        orderNo: index + 1,
      })),
    );
    const serializedGymLeaderParty = JSON.stringify(
      gymLeaderDetail.animals.map((animal) => ({
        environment: ENVIRONMENT_BY_CARD_TYPE[animal.cardType],
        id: String(animal.orderNo),
        imageUri: animal.animalImageUrl,
        name: animal.animalName,
        orderNo: animal.orderNo,
      })),
    );

    const battle = await createBattle({
      gymLeaderId: gymLeaderDetail.gymLeader.gymLeaderId,
      entries,
    });

    if (!battle) {
      const createError = getCreateBattleError();
      const isActiveBattleConflict =
        createError instanceof ApiError &&
        createError.status === 409 &&
        createError.message.replace(/\s/g, '').includes('진행중');

      if (!isActiveBattleConflict) {
        clearCreateBattleError();
        setBattleStartErrorMessage(
          createError instanceof Error
            ? createError.message
            : '대전을 시작하지 못했습니다.',
        );
        return;
      }

      clearCreateBattleError();
      const resumedBattle = await resumeBattle(LEGACY_ACTIVE_BATTLE_ID);

      if (!resumedBattle || resumedBattle.state.status !== 'IN_PROGRESS') {
        return;
      }

      const { state } = resumedBattle;
      const serializedRecoveredUserParty = JSON.stringify([
        {
          environment: ENVIRONMENT_BY_CARD_TYPE[state.userEntry.cardType],
          id: String(state.userEntry.captureId),
          name: state.userEntry.animalName,
          orderNo: state.userEntry.orderNo,
        },
      ]);
      const serializedRecoveredNpcParty =
        gymLeaderDetail.gymLeader.gymLeaderId === state.gymLeaderId
          ? serializedGymLeaderParty
          : JSON.stringify([
              {
                environment:
                  ENVIRONMENT_BY_CARD_TYPE[state.npcEntry.cardType],
                id: String(state.npcEntry.captureId),
                name: state.npcEntry.animalName,
                orderNo: state.npcEntry.orderNo,
              },
            ]);

      await saveBattleSession({
        battleId: state.battleId,
        coach,
        lastPlayedEventSeq: resumedBattle.session?.lastPlayedEventSeq,
        npcParty: serializedRecoveredNpcParty,
        party: serializedRecoveredUserParty,
      });
      router.replace({
        pathname: '/battle-arena',
        params: {
          battleId: String(state.battleId),
          coach,
          initialBattleState: JSON.stringify(state),
          npcParty: serializedRecoveredNpcParty,
          party: serializedRecoveredUserParty,
        },
      });
      return;
    }

    await saveBattleSession({
      battleId: battle.battleId,
      coach,
      npcParty: serializedGymLeaderParty,
      party: serializedSelectedParty,
    });

    router.replace({
      pathname: '/battle-arena',
      params: {
        battleId: String(battle.battleId),
        initialBattleState: JSON.stringify(battle.initialState),
        coach,
        gymLeaderCode: gymLeaderDetail.gymLeader.code,
        gymLeaderId: String(gymLeaderDetail.gymLeader.gymLeaderId),
        gymLeaderImageUrl: gymLeaderDetail.gymLeader.imageUrl,
        gymLeaderName: gymLeaderDetail.gymLeader.name,
        isNewBattle: 'true',
        party: serializedSelectedParty,
        npcParty: serializedGymLeaderParty,
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader
        coinReward={
          gymLeaderDetail && !gymLeaderDetail.gymLeader.cleared
            ? gymLeaderDetail.gymLeader.coinReward
            : 0
        }
        experienceReward={
          gymLeaderDetail && !gymLeaderDetail.gymLeader.cleared
            ? gymLeaderDetail.gymLeader.experienceReward
            : 0
        }
      />
      <BattleCreatureSelector
        headerContent={
          <View style={styles.matchup}>
              {gymLeaderDetail ? (
                <GymLeaderDetailCard detail={gymLeaderDetail} />
              ) : (
                <View style={styles.detailStatus}>
                  <Text style={styles.detailStatusText}>
                    {errorMessage ??
                      (isLoading ? '관장 정보를 불러오는 중...' : '')}
                  </Text>
                  {errorMessage && (
                    <Pressable
                      onPress={() => void reload()}
                      style={styles.retryButton}
                    >
                      <Text style={styles.retryButtonText}>다시 시도</Text>
                    </Pressable>
                  )}
                </View>
              )}
              <BattleMatchSelection
                onMoveCreature={(fromIndex, toIndex) =>
                  setSelectedCreatures((currentCreatures) => {
                    const reorderedCreatures = [...currentCreatures];
                    const [movedCreature] = reorderedCreatures.splice(
                      fromIndex,
                      1,
                    );

                    if (!movedCreature || toIndex >= currentCreatures.length) {
                      return currentCreatures;
                    }

                    reorderedCreatures.splice(toIndex, 0, movedCreature);
                    return reorderedCreatures;
                  })
                }
                onRemoveCreature={(creatureId) =>
                  setSelectedCreatures((currentCreatures) =>
                    currentCreatures.filter(
                      (creature) => creature.id !== creatureId,
                    ),
                  )
                }
                recommendedCreatureEnvironments={
                  recommendedCreatureEnvironments
                }
                selectedCreatures={selectedCreatures}
                tipDescription={gymLeaderDetail?.gymLeader.tipDescription}
                userLevel={profile?.level}
                userNickname={profile?.nickname}
              />
          </View>
        }
        onToggleCreature={(creature) =>
            setSelectedCreatures((currentCreatures) => {
              const isAlreadySelected = currentCreatures.some(
                (selectedCreature) =>
                  selectedCreature.id === creature.id,
              );

              if (isAlreadySelected) {
                return currentCreatures.filter(
                  (selectedCreature) =>
                    selectedCreature.id !== creature.id,
                );
              }

              if (currentCreatures.length >= 3) {
                return currentCreatures;
              }

              return [...currentCreatures, creature];
            })
        }
        recommendedCreatureEnvironments={recommendedCreatureEnvironments}
        refreshKey={creatureListRefreshKey}
        selectedCreatureIds={selectedCreatures.map(
          (creature) => creature.id,
        )}
      />
      <BattleActionBar
        isEnabled={
          selectedCreatures.length === 3 &&
          Boolean(gymLeaderDetail?.gymLeader.unlock.unlocked)
        }
        isLoading={isCreatingBattle || isResumingBattle}
        onPress={() => void handleStartBattle()}
      />
      <ErrorModal
        message={resumeBattleErrorMessage}
        onClose={clearResumeBattleError}
      />
      <ErrorModal
        message={battleStartErrorMessage}
        onClose={() => setBattleStartErrorMessage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF5EB',
  },
  detailStatus: {
    width: scaleByDeviceWidth(328),
    minHeight: scaleByDeviceWidth(120),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleByDeviceWidth(10),
  },
  detailStatusText: {
    color: '#8B704D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  retryButton: {
    paddingVertical: scaleByDeviceWidth(7),
    paddingHorizontal: scaleByDeviceWidth(12),
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: '#E8D5B4',
  },
  retryButtonText: {
    color: '#675744',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(16),
  },
  matchup: {
    position: 'relative',
    width: scaleByDeviceWidth(328),
    alignItems: 'center',
    gap: scaleByDeviceWidth(8),
    marginBottom: scaleByDeviceWidth(16),
  },
});
