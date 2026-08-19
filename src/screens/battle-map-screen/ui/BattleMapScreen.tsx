import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const BATTLE_MAP = require('@/src/shared/assets/images/battle/battle-coach-map.png');
const MORU_COACH = require('@/src/shared/assets/images/battle/moru-coach.png');
const MAP_ORIGINAL_WIDTH = 1440;
const MAP_ORIGINAL_HEIGHT = 7648;
const MORU_DESIGN_WIDTH = 360;
const MORU_CENTER_X = 720;
const MORU_TOP = 6810;

export function BattleMapScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const mapHeight = screenWidth * (MAP_ORIGINAL_HEIGHT / MAP_ORIGINAL_WIDTH);
  const moruWidth = screenWidth * (MORU_DESIGN_WIDTH / MAP_ORIGINAL_WIDTH);
  const moruLeft =
    screenWidth * (MORU_CENTER_X / MAP_ORIGINAL_WIDTH) - moruWidth / 2;
  const moruTop = mapHeight * (MORU_TOP / MAP_ORIGINAL_HEIGHT);

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;

        if (nextWidth !== screenWidth) {
          setScreenWidth(nextWidth);
        }
      }}
      style={styles.screen}
    >
      {screenWidth > 0 && (
        <ScrollView
          bounces={false}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            resizeMode="contain"
            source={BATTLE_MAP}
            style={{ width: screenWidth, height: mapHeight }}
          >
            <Pressable
              accessibilityLabel="땅 관장 모루에게 도전하기"
              accessibilityRole="button"
              onPress={() => router.push('/battle-moru')}
              style={({ pressed }) => [
                styles.moruButton,
                {
                  top: moruTop,
                  left: moruLeft,
                  width: moruWidth,
                  height: moruWidth,
                },
                pressed && styles.pressed,
              ]}
            >
              <Image resizeMode="contain" source={MORU_COACH} style={styles.moruImage} />
            </Pressable>
          </ImageBackground>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1189E3',
  },
  moruButton: {
    position: 'absolute',
  },
  moruImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
});
