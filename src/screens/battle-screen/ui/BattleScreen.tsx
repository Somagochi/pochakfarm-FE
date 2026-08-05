import { Image, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const EMPTY_STATE_IMAGE = require('@/src/shared/assets/images/battle/empty-state.png');

export function BattleScreen() {
  return (
    <View style={styles.screen}>
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
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(189),
  },
});
