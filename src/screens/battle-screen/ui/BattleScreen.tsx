import { Image, ScrollView, StyleSheet } from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BattleCreatureSelector } from '@/src/features/select-battle-creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { BattleActionBar } from '@/src/widgets/battle-action-bar';
import { BattleHeader } from '@/src/widgets/battle-header';

const BATTLE_LINEUP_GUIDE = require('@/src/shared/assets/images/battle/battle-lineup-guide.png');
const GUIDE_WIDTH = scaleByDeviceWidth(328);
const GUIDE_HEIGHT = GUIDE_WIDTH * (231 / 328);

export function BattleScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isCreatureListInteracting, setIsCreatureListInteracting] =
    useState(false);
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
        <Image
          accessibilityLabel="관장 라인업과 출전 동물 선택 안내"
          resizeMode="contain"
          source={BATTLE_LINEUP_GUIDE}
          style={styles.lineupGuide}
        />
        <BattleCreatureSelector
          onListInteractionEnd={() => setScreenScrollEnabled(true)}
          onListInteractionStart={() => setScreenScrollEnabled(false)}
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
    height: GUIDE_HEIGHT,
  },
});
