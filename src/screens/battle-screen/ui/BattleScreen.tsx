import { Image, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const EMPTY_STATE_IMAGE = require('@/src/shared/assets/images/battle/empty-state.png');
const BACKGROUND_IMAGE = require('@/src/shared/assets/images/battle/background.png');
const EMPTY_STATE_WIDTH = scaleByDeviceWidth(280);
const EMPTY_STATE_HEIGHT = EMPTY_STATE_WIDTH * (748 / 1120);

export function BattleScreen() {
  return (
    <View style={styles.screen}>
      <Image
        accessible={false}
        resizeMode="cover"
        source={BACKGROUND_IMAGE}
        style={styles.background}
      />
      <Image
        accessibilityLabel="곧 업데이트 될 예정이에요. 조금만 더 기다려주세요"
        resizeMode="contain"
        source={EMPTY_STATE_IMAGE}
        style={styles.emptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EE',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  emptyState: {
    width: EMPTY_STATE_WIDTH,
    height: EMPTY_STATE_HEIGHT,
  },
});
