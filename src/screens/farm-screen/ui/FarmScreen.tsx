import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FarmField } from '@/src/widgets/farm-field';
import {
  CoinBalanceBar,
  FarmEnvironmentSelector,
  FarmStatusBar,
  FarmUtilityButtons,
} from '@/src/widgets/farm-status-bar';

export function FarmScreen() {
  const insets = useSafeAreaInsets();
  const [contentSize, setContentSize] = useState({
    height: 0,
    width: 0,
  });

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setContentSize((currentSize) => {
          if (
            currentSize.height === height &&
            currentSize.width === width
          ) {
            return currentSize;
          }

          return { height, width };
        });
      }}
      style={styles.screen}
    >
      {contentSize.width > 0 && contentSize.height > 0 && (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FarmField width={contentSize.width} />
        </ScrollView>
      )}
      <View style={[styles.statusControls, { top: insets.top + 2.2 }]}>
        <FarmStatusBar />
        <View style={styles.actionButton}>
          <FarmEnvironmentSelector />
        </View>
      </View>
      <View style={[styles.rightControls, { top: insets.top + 2.2 }]}>
        <CoinBalanceBar />
        <View style={styles.utilityButtons}>
          <FarmUtilityButtons />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#5CB33E',
    width: '100%',
  },
  statusControls: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  actionButton: {
    marginTop: 4.4,
  },
  rightControls: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  utilityButtons: {
    marginTop: 4.4,
    alignSelf: 'flex-end',
  },
});
