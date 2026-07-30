import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SPLASH_IMAGE = require('@/assets/images/splash.png');

export function AppSplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        accessibilityLabel="포착팜 시작 화면"
        resizeMode="cover"
        source={SPLASH_IMAGE}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4AB4E4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
