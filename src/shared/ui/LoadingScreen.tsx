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
  visible?: boolean;
};

export function LoadingScreen({
  accessibilityLabel = '화면 불러오는 중',
  style,
  visible = true,
}: LoadingScreenProps) {
  return (
    <View
      accessibilityElementsHidden={!visible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.container, style, !visible && styles.hidden]}
    >
      <Image
        accessible={false}
        resizeMode="cover"
        source={BATTLE_BACKGROUND_IMAGE}
        style={styles.background}
      />
      <ActivityIndicator
        animating={visible}
        color="#8B6B3F"
        size="large"
      />
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
  hidden: {
    opacity: 0,
  },
});
