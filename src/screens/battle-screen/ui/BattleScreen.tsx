import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { BattleHeader } from '@/src/widgets/battle-header';
import { BattleMatchSelection } from '@/src/widgets/battle-match-selection';

const MORU_RECOMMENDED_ENVIRONMENTS: readonly CreatureEnvironment[] = [
  'land',
  'sea',
];
const ENVIRONMENT_BY_CARD_TYPE: Record<
  AnimalCardType,
  CreatureEnvironment
> = {
  GROUND: 'land',
  SEA: 'sea',
  SKY: 'sky',
  SPACE: 'space',
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
  const { createBattle, isLoading: isCreatingBattle } = useCreateBattle();
  const [selectedCreatures, setSelectedCreatures] = useState<
    FarmCreatureListItem[]
  >([]);
  const recommendedCreatureEnvironments = useMemo(() => {
    if (!gymLeaderDetail) {
      return MORU_RECOMMENDED_ENVIRONMENTS;
    }

    return Array.from(
      new Set(
        gymLeaderDetail.animals.map(
          (animal) => ENVIRONMENT_BY_CARD_TYPE[animal.cardType],
        ),
      ),
    ).filter((environment): environment is CreatureEnvironment =>
      Boolean(environment),
    );
  }, [gymLeaderDetail]);

  const handleStartBattle = async () => {
    if (!gymLeaderDetail || selectedCreatures.length !== 3) {
      return;
    }

    const entries = selectedCreatures.map((creature, index) => ({
      animalId: Number(creature.id),
      orderNo: index + 1,
    }));

    if (entries.some((entry) => !Number.isSafeInteger(entry.animalId))) {
      Alert.alert('대전 시작 실패', '출전 동물 정보가 올바르지 않습니다.');
      return;
    }

    const battle = await createBattle({
      gymLeaderId: gymLeaderDetail.gymLeader.gymLeaderId,
      entries,
    });

    if (!battle) {
      Alert.alert(
        '대전 시작 실패',
        '대전을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      return;
    }

    router.push({
      pathname: '/battle-arena',
      params: {
        battleId: String(battle.battleId),
        initialBattleState: JSON.stringify(battle.initialState),
        coach,
        gymLeaderCode: gymLeaderDetail.gymLeader.code,
        gymLeaderId: String(gymLeaderDetail.gymLeader.gymLeaderId),
        gymLeaderName: gymLeaderDetail.gymLeader.name,
        party: JSON.stringify(
          selectedCreatures.map((creature, index) => ({
            environment: creature.environment,
            id: creature.id,
            imageUri: creature.creatureImageUri,
            name: creature.name,
            orderNo: index + 1,
          })),
        ),
        npcParty: JSON.stringify(
          gymLeaderDetail.animals.map((animal) => ({
            environment: ENVIRONMENT_BY_CARD_TYPE[animal.cardType],
            id: String(animal.orderNo),
            imageUri: animal.animalImageUrl,
            name: animal.animalName,
            orderNo: animal.orderNo,
          })),
        ),
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader />
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
        selectedCreatureIds={selectedCreatures.map(
          (creature) => creature.id,
        )}
      />
      <BattleActionBar
        isEnabled={
          selectedCreatures.length === 3 &&
          Boolean(gymLeaderDetail?.gymLeader.unlock.unlocked)
        }
        isLoading={isCreatingBattle}
        onPress={() => void handleStartBattle()}
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
