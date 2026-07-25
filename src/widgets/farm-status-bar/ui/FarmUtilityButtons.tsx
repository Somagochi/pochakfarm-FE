import { Image, Pressable, StyleSheet, View } from 'react-native';

const NOTIFICATION_BUTTON = require('@/src/shared/assets/images/farm-status/notification-button.png');
const SEARCH_BUTTON = require('@/src/shared/assets/images/farm-status/search-button.png');

type FarmUtilityButtonsProps = {
  onPressNotification?: () => void;
  onPressSearch?: () => void;
};

export function FarmUtilityButtons({
  onPressNotification,
  onPressSearch,
}: FarmUtilityButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="알림"
        accessibilityRole="button"
        onPress={() => onPressNotification?.()}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={NOTIFICATION_BUTTON} style={styles.buttonImage} />
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
    gap: 4.4,
  },
  buttonImage: {
    width: 30.68,
    height: 29.07,
  },
  pressed: {
    opacity: 0.8,
  },
});
