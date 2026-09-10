import { Image, Pressable, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const START_BATTLE_BUTTON = require('@/src/shared/assets/images/battle/start-battle-button.png');
const START_BATTLE_BUTTON_ACTIVE = require('@/src/shared/assets/images/battle/start-battle-button-active.png');
const BUTTON_WIDTH = scaleByDeviceWidth(280);
const BUTTON_HEIGHT = BUTTON_WIDTH * (60 / 280);

type BattleActionBarProps = {
  isEnabled: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function BattleActionBar({
  isEnabled,
  isLoading = false,
  onPress,
}: BattleActionBarProps) {
  const isDisabled = !isEnabled || isLoading;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityState={{ busy: isLoading, disabled: isDisabled }}
        accessibilityLabel="대전 시작"
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Image
          resizeMode="contain"
          source={isDisabled ? START_BATTLE_BUTTON : START_BATTLE_BUTTON_ACTIVE}
          style={styles.buttonImage}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(12),
    paddingBottom: scaleByDeviceWidth(12),
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
});
