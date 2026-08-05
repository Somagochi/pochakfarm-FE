import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { AchievementCardList } from '@/src/widgets/achievement-card-list';

const COLLECTION_HEADER = require('@/src/shared/assets/images/collection/collection-header.png');

export function CollectionScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <Image
        resizeMode="stretch"
        source={COLLECTION_HEADER}
        style={[
          styles.header,
          { marginTop: insets.top + scaleByDeviceWidth(10) },
        ]}
      />
      <AchievementCardList />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
  },
  header: {
    width: scaleByDeviceWidth(360),
    height: scaleByDeviceWidth(89),
  },
});
