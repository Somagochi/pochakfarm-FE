import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

const FARM_IMAGE = require('@/src/shared/assets/images/farm/farm-background.png');
const { width: imageWidth, height: imageHeight } =
  Image.resolveAssetSource(FARM_IMAGE);
const FARM_IMAGE_RATIO = imageHeight / imageWidth;

export function FarmScreen() {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <Image
        resizeMode="contain"
        source={FARM_IMAGE}
        style={{
          width: screenWidth,
          height: screenWidth * FARM_IMAGE_RATIO,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#5CB33E',
    width: '100%',
  },
});
