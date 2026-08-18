import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import type { FarmCreatureListItem } from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { BattleHeader } from '@/src/widgets/battle-header';
import { BattleMatchSelection } from '@/src/widgets/battle-match-selection';

const BATTLE_LINEUP_GUIDE = require('@/src/shared/assets/images/battle/battle-lineup-guide.png');
const VERSUS_IMAGE = require('@/src/shared/assets/images/battle/versus.png');
const GUIDE_WIDTH = scaleByDeviceWidth(328);
const LINEUP_GUIDE_HEIGHT = GUIDE_WIDTH * (470 / 1314);
const VERSUS_WIDTH = scaleByDeviceWidth(37.5);
const VERSUS_HEIGHT = VERSUS_WIDTH * (113 / 150);
const AUTO_MATCH_CARD_WIDTH = scaleByDeviceWidth(112);
const MATCH_SELECTION_GAP = scaleByDeviceWidth(8);
const BATTLE_PARTY_CARD_WIDTH = scaleByDeviceWidth(208);

export function BattleScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isCreatureListInteracting, setIsCreatureListInteracting] =
    useState(false);
  const [selectedCreatures, setSelectedCreatures] = useState<
    FarmCreatureListItem[]
  >([]);
  const setScreenScrollEnabled = useCallback((isEnabled: boolean) => {
    scrollViewRef.current?.setNativeProps({ scrollEnabled: isEnabled });
    setIsCreatureListInteracting(!isEnabled);
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <BattleHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        ref={scrollViewRef}
        scrollEnabled={!isCreatureListInteracting}
        style={styles.scrollView}
      >
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
            selectedCreatures={selectedCreatures}
          />
          <Image
            accessible={false}
            resizeMode="contain"
            source={VERSUS_IMAGE}
            style={styles.versus}
          />
        </View>
        <BattleCreatureSelector
          onListInteractionEnd={() => setScreenScrollEnabled(true)}
          onListInteractionStart={() => setScreenScrollEnabled(false)}
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
          selectedCreatureIds={selectedCreatures.map(
            (creature) => creature.id,
          )}
        />
      </ScrollView>
      <BattleActionBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF5EB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(16),
    paddingBottom: scaleByDeviceWidth(16),
    gap: scaleByDeviceWidth(16),
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
  },
  versus: {
    position: 'absolute',
    top:
      LINEUP_GUIDE_HEIGHT +
      scaleByDeviceWidth(4) -
      VERSUS_HEIGHT / 2,
    left:
      AUTO_MATCH_CARD_WIDTH +
      MATCH_SELECTION_GAP +
      (BATTLE_PARTY_CARD_WIDTH - VERSUS_WIDTH) / 2,
    zIndex: 1,
    width: VERSUS_WIDTH,
    height: VERSUS_HEIGHT,
  },
});
