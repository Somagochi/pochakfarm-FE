import {
  ActivityIndicator,
  Image,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

const BATTLE_BACKGROUND_IMAGE = require('@/src/shared/assets/images/battle/background.png');

type LoadingScreenProps = {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingScreen({
  accessibilityLabel = '화면 불러오는 중',
  style,
}: LoadingScreenProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.container, style]}
    >
      <Image
        accessible={false}
        resizeMode="cover"
        source={BATTLE_BACKGROUND_IMAGE}
        style={styles.background}
      />
      <ActivityIndicator color="#8B6B3F" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EE',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
