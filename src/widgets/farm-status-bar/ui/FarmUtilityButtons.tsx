import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const NOTIFICATION_BUTTON = require('@/src/shared/assets/images/farm-status/notification-button.png');
const SEARCH_BUTTON = require('@/src/shared/assets/images/farm-status/search-button.png');
const REFRESH_BUTTON_BACKGROUND = require('@/src/shared/assets/images/farm-status/refresh-button-background.png');

type FarmUtilityButtonsProps = {
  onPressNotification?: () => void;
  onPressRefresh?: () => void;
  onPressSearch?: () => void;
};

export function FarmUtilityButtons({
  onPressNotification,
  onPressRefresh,
  onPressSearch,
}: FarmUtilityButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="농장 새로고침"
        accessibilityRole="button"
        onPress={() => onPressRefresh?.()}
        style={({ pressed }) => [
          styles.refreshButton,
          pressed && styles.pressed,
        ]}
      >
        <Image
          source={REFRESH_BUTTON_BACKGROUND}
          style={styles.buttonImage}
        />
        <Ionicons
          color="#000000"
          name="refresh"
          size={scaleByDeviceWidth(21)}
          style={styles.refreshIcon}
        />
      </Pressable>
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
    gap: scaleByDeviceWidth(4.4),
  },
  buttonImage: {
    width: scaleByDeviceWidth(30.68),
    height: scaleByDeviceWidth(29.07),
  },
  refreshButton: {
    width: scaleByDeviceWidth(30.68),
    height: scaleByDeviceWidth(29.07),
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    position: 'absolute',
  },
  pressed: {
    opacity: 0.8,
  },
});
