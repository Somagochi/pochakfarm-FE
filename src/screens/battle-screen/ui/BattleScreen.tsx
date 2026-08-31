import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const BACKGROUND_IMAGE = require('@/src/shared/assets/images/battle/coming-soon-background.png');
const SIGNBOARD_IMAGE = require('@/src/shared/assets/images/battle/coming-soon-signboard.png');
const BACKGROUND_SOURCE_WIDTH = 1440;
const BACKGROUND_SOURCE_HEIGHT = 2992;
const REFERENCE_SCREEN_WIDTH = 360;
const SIGNBOARD_WIDTH_RATIO = 191 / REFERENCE_SCREEN_WIDTH;
const SIGNBOARD_HEIGHT_RATIO = 115 / REFERENCE_SCREEN_WIDTH;
const SIGNBOARD_TOP_RATIO = 0.575;

export function BattleScreen() {
  const [screenSize, setScreenSize] = useState({ height: 0, width: 0 });
  const backgroundScale = Math.max(
    screenSize.width / BACKGROUND_SOURCE_WIDTH,
    screenSize.height / BACKGROUND_SOURCE_HEIGHT,
  );
  const backgroundWidth = BACKGROUND_SOURCE_WIDTH * backgroundScale;
  const backgroundHeight = BACKGROUND_SOURCE_HEIGHT * backgroundScale;
  const signboardWidth = backgroundWidth * SIGNBOARD_WIDTH_RATIO;
  const signboardHeight = backgroundWidth * SIGNBOARD_HEIGHT_RATIO;

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setScreenSize((currentSize) => {
          if (
            currentSize.height === height &&
            currentSize.width === width
          ) {
            return currentSize;
          }

          return { height, width };
        });
      }}
      style={styles.screen}
    >
      {backgroundWidth > 0 && backgroundHeight > 0 && (
        <View
          style={[
            styles.backgroundLayer,
            {
              left: (screenSize.width - backgroundWidth) / 2,
              width: backgroundWidth,
              height: backgroundHeight,
            },
          ]}
        >
          <Image
            accessible={false}
            resizeMode="stretch"
            source={BACKGROUND_IMAGE}
            style={styles.background}
          />
          <Image
            accessibilityLabel="9월 11일 업데이트 예정"
            resizeMode="contain"
            source={SIGNBOARD_IMAGE}
            style={[
              styles.signboard,
              {
                top: backgroundHeight * SIGNBOARD_TOP_RATIO,
                left: (backgroundWidth - signboardWidth) / 2,
                width: signboardWidth,
                height: signboardHeight,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F2EBDD',
  },
  backgroundLayer: {
    position: 'absolute',
    bottom: 0,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  signboard: {
    position: 'absolute',
  },
});
