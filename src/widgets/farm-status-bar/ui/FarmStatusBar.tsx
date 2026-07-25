import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

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
    width: 144,
    height: 32,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
  },
  name: {
    maxWidth: 67,
    color: '#332F27',
    fontSize: 15,
    fontWeight: '700',
  },
  levelBadge: {
    minWidth: 40,
    height: 19,
    marginLeft: 'auto',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#CDB999',
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#E8DCC8',
  },
  level: {
    color: '#685A48',
    fontSize: 10,
    lineHeight: 12,
  },
});
