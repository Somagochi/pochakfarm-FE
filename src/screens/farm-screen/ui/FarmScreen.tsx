import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FarmCreatureSearchModal } from '@/src/features/find-farm-creature';
import { useUserProfile } from '@/src/entities/user';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { CreatureDetailSheet } from '@/src/widgets/creature-detail-sheet';
import { FarmField } from '@/src/widgets/farm-field';
import {
  CoinBalanceBar,
  FarmEnvironmentSelector,
  FarmStatusBar,
  FarmUtilityButtons,
  type SelectableFarmEnvironment,
} from '@/src/widgets/farm-status-bar';

export function FarmScreen() {
  const insets = useSafeAreaInsets();
  const { clearError, errorMessage, profile } = useUserProfile();
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<SelectableFarmEnvironment>('land');
  const [isCreatureDetailVisible, setIsCreatureDetailVisible] =
    useState(false);
  const [isCreatureSearchVisible, setIsCreatureSearchVisible] =
    useState(false);
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
          key={selectedEnvironment}
          showsVerticalScrollIndicator={false}
        >
          <FarmField
            environment={selectedEnvironment}
            onPressCreature={() =>
              setIsCreatureDetailVisible(true)
            }
            width={contentSize.width}
          />
        </ScrollView>
      )}
      <View
        style={[
          styles.statusControls,
          { top: insets.top + scaleByDeviceWidth(2.2) },
        ]}
      >
        <FarmStatusBar
          level={profile?.level ?? 0}
          name={profile?.nickname ?? ''}
        />
        <View style={styles.actionButton}>
          <FarmEnvironmentSelector
            onSelectEnvironment={setSelectedEnvironment}
            selectedEnvironment={selectedEnvironment}
          />
        </View>
      </View>
      <View
        style={[
          styles.rightControls,
          { top: insets.top + scaleByDeviceWidth(2.2) },
        ]}
      >
        <CoinBalanceBar balance={profile?.coins ?? 0} />
        <View style={styles.utilityButtons}>
          <FarmUtilityButtons
            onPressSearch={() => setIsCreatureSearchVisible(true)}
          />
        </View>
      </View>
      <FarmCreatureSearchModal
        onClose={() => setIsCreatureSearchVisible(false)}
        visible={isCreatureSearchVisible}
      />
      {isCreatureDetailVisible && (
        <CreatureDetailSheet
          onClose={() => setIsCreatureDetailVisible(false)}
          width={contentSize.width}
        />
      )}
      <ErrorModal message={errorMessage} onClose={clearError} />
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
    left: scaleByDeviceWidth(12),
    zIndex: 1,
  },
  actionButton: {
    marginTop: scaleByDeviceWidth(4.4),
  },
  rightControls: {
    position: 'absolute',
    right: scaleByDeviceWidth(12),
    zIndex: 1,
  },
  utilityButtons: {
    marginTop: scaleByDeviceWidth(4.4),
    alignSelf: 'flex-end',
  },
});
