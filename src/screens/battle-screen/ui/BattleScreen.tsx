import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  GymLeaderDetailCard,
  isBattleCoachId,
  useGymLeaderDetail,
} from '@/src/entities/battle';
import type {
  CreatureEnvironment,
  FarmCreatureListItem,
} from '@/src/entities/creature';
import { useUserProfile } from '@/src/entities/user';
import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { BattleHeader } from '@/src/widgets/battle-header';
import { BattleMatchSelection } from '@/src/widgets/battle-match-selection';

const MORU_RECOMMENDED_ENVIRONMENTS: readonly CreatureEnvironment[] = [
  'land',
  'sea',
];

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
  const [selectedCreatures, setSelectedCreatures] = useState<
    FarmCreatureListItem[]
  >([]);
  const recommendedCreatureEnvironments = useMemo(() => {
    if (!gymLeaderDetail) {
      return MORU_RECOMMENDED_ENVIRONMENTS;
    }

    const environmentByCardType: Record<string, CreatureEnvironment> = {
      GROUND: 'land',
      SEA: 'sea',
      SKY: 'sky',
      SPACE: 'space',
    };

    return Array.from(
      new Set(
        gymLeaderDetail.animals.map(
          (animal) => environmentByCardType[animal.cardType],
        ),
      ),
    ).filter((environment): environment is CreatureEnvironment =>
      Boolean(environment),
    );
  }, [gymLeaderDetail]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader
        subtitle={
          gymLeaderDetail
            ? `${gymLeaderDetail.gymLeader.name} 관장`
            : undefined
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
        onPress={() =>
          router.push({
            pathname: '/battle-arena',
            params: {
              coach,
              gymLeaderCode: gymLeaderDetail?.gymLeader.code,
              gymLeaderId: gymLeaderDetail
                ? String(gymLeaderDetail.gymLeader.gymLeaderId)
                : undefined,
              gymLeaderName: gymLeaderDetail?.gymLeader.name,
              party: JSON.stringify(
                selectedCreatures.map((creature) => ({
                  environment: creature.environment,
                  id: creature.id,
                  imageUri: creature.creatureImageUri,
                  name: creature.name,
                })),
              ),
            },
          })
        }
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
