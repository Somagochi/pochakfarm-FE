import { Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import type {
  CreatureEnvironment,
  FarmCreatureListItem,
} from '@/src/entities/creature';
import { useUserProfile } from '@/src/entities/user';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { BattleHeader } from '@/src/widgets/battle-header';
import { BattleMatchSelection } from '@/src/widgets/battle-match-selection';

const BATTLE_LINEUP_GUIDE = require('@/src/shared/assets/images/battle/battle-lineup-guide.png');
const GUIDE_WIDTH = scaleByDeviceWidth(328);
const LINEUP_GUIDE_HEIGHT = GUIDE_WIDTH * (470 / 1314);
const MORU_RECOMMENDED_ENVIRONMENTS: readonly CreatureEnvironment[] = [
  'land',
  'sea',
];

export function BattleScreen() {
  const { profile } = useUserProfile();
  const [selectedCreatures, setSelectedCreatures] = useState<
    FarmCreatureListItem[]
  >([]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader />
      <BattleCreatureSelector
          headerContent={
            <View style={styles.matchup}>
              <Image
                accessibilityLabel="땅 관장 모루의 동물 라인업"
                resizeMode="contain"
                source={BATTLE_LINEUP_GUIDE}
                style={styles.lineupGuide}
              />
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
                  MORU_RECOMMENDED_ENVIRONMENTS
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
          recommendedCreatureEnvironments={MORU_RECOMMENDED_ENVIRONMENTS}
          selectedCreatureIds={selectedCreatures.map(
            (creature) => creature.id,
          )}
      />
      <BattleActionBar
        isEnabled={selectedCreatures.length === 3}
        onPress={() =>
          router.push({
            pathname: '/battle-arena',
            params: {
              coach: 'moru',
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
  lineupGuide: {
    width: GUIDE_WIDTH,
    height: LINEUP_GUIDE_HEIGHT,
  },
  matchup: {
    position: 'relative',
    width: GUIDE_WIDTH,
    alignItems: 'center',
    gap: scaleByDeviceWidth(8),
    marginBottom: scaleByDeviceWidth(16),
  },
});
