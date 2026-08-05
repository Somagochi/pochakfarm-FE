import { Image, Pressable, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const SEARCH_BUTTON = require('@/src/shared/assets/images/farm-status/search-button.png');
const ANIMAL_SWITCH_BUTTON = require('@/src/shared/assets/images/farm-status/animal-switch-button.png');

type FarmUtilityButtonsProps = {
  onPressAnimalSwitch?: () => void;
  onPressSearch?: () => void;
};

export function FarmUtilityButtons({
  onPressAnimalSwitch,
  onPressSearch,
}: FarmUtilityButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="농장 동물 교체"
        accessibilityRole="button"
        onPress={() => onPressAnimalSwitch?.()}
        style={({ pressed }) => [
          styles.animalSwitchButton,
          pressed && styles.pressed,
        ]}
      >
        <Image source={ANIMAL_SWITCH_BUTTON} style={styles.buttonImage} />
      </Pressable>
      <Pressable
        accessibilityLabel="검색"
        accessibilityRole="button"
        onPress={() => onPressSearch?.()}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={SEARCH_BUTTON} style={styles.buttonImage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: scaleByDeviceWidth(4.4),
  },
  buttonImage: {
    width: scaleByDeviceWidth(30.68),
    height: scaleByDeviceWidth(29.07),
  },
  animalSwitchButton: {
    width: scaleByDeviceWidth(30.68),
    height: scaleByDeviceWidth(29.07),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
