import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const STATUS_BACKGROUND = require('@/src/shared/assets/images/farm-status/status-background.png');
const PAW_ICON = require('@/src/shared/assets/images/farm-status/paw.png');

type FarmStatusBarProps = {
  level?: number;
  name?: string;
  onPress?: () => void;
};

export function FarmStatusBar({
  level = 12,
  name = '소마고치',
  onPress,
}: FarmStatusBarProps) {
  return (
    <Pressable
      accessibilityLabel="내 프로필 더보기"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <ImageBackground
        resizeMode="stretch"
        source={STATUS_BACKGROUND}
        style={styles.background}
      >
        <Image resizeMode="contain" source={PAW_ICON} style={styles.pawIcon} />
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <View style={styles.levelBadge}>
          <Text style={styles.level}>Lv.{level}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(177),
    height: scaleByDeviceWidth(32),
  },
  background: {
    flex: 1,
    paddingHorizontal: scaleByDeviceWidth(11),
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawIcon: {
    width: scaleByDeviceWidth(14),
    height: scaleByDeviceWidth(14),
    marginRight: scaleByDeviceWidth(5),
  },
  name: {
    maxWidth: scaleByDeviceWidth(90),
    color: '#332F27',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
  },
  levelBadge: {
    minWidth: scaleByDeviceWidth(40),
    height: scaleByDeviceWidth(19),
    marginLeft: 'auto',
    paddingHorizontal: scaleByDeviceWidth(5),
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#CDB999',
    borderRadius: scaleByDeviceWidth(10),
    borderWidth: scaleByDeviceWidth(1),
    backgroundColor: '#E8DCC8',
  },
  level: {
    color: '#685A48',
    fontSize: scaleByDeviceWidth(10),
    lineHeight: scaleByDeviceWidth(12),
  },
  pressed: {
    opacity: 0.8,
  },
});
