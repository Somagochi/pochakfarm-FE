import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const STATUS_BACKGROUND = require('@/src/shared/assets/images/farm-status/status-background.png');
const PAW_ICON = require('@/src/shared/assets/images/farm-status/paw.png');

type FarmStatusBarProps = {
  level?: number;
  name?: string;
};

export function FarmStatusBar({
  level = 12,
  name = '소마고치',
}: FarmStatusBarProps) {
  return (
    <ImageBackground
      resizeMode="stretch"
      source={STATUS_BACKGROUND}
      style={styles.container}
    >
      <Image resizeMode="contain" source={PAW_ICON} style={styles.pawIcon} />
      <Text numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <View style={styles.levelBadge}>
        <Text style={styles.level}>Lv.{level}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: scaleByDeviceWidth(144),
    height: scaleByDeviceWidth(32),
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
    maxWidth: scaleByDeviceWidth(67),
    color: '#332F27',
    fontSize: scaleByDeviceWidth(15),
    fontWeight: '700',
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
});
