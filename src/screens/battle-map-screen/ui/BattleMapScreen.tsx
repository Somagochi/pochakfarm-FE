import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

const BATTLE_MAP = require('@/src/shared/assets/images/battle/battle-coach-map.png');
const COACH_SELECTED_EXCLAMATION = require('@/src/shared/assets/images/battle/coach-selected-exclamation.png');
const MORU_COACH = require('@/src/shared/assets/images/battle/moru-coach.png');
const HARU_COACH = require('@/src/shared/assets/images/battle/haru-coach.png');
const HARU_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/haru-coach-silhouette.png');
const NIO_COACH = require('@/src/shared/assets/images/battle/nio-coach.png');
const NIO_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/nio-coach-silhouette.png');
const RAON_COACH = require('@/src/shared/assets/images/battle/raon-coach.png');
const RAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/raon-coach-silhouette.png');
const BYEOLI_COACH = require('@/src/shared/assets/images/battle/byeoli-coach.png');
const BYEOLI_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/byeoli-coach-silhouette.png');
const GAON_COACH = require('@/src/shared/assets/images/battle/gaon-coach.png');
const GAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/gaon-coach-silhouette.png');
const DAON_COACH = require('@/src/shared/assets/images/battle/daon-coach.png');
const DAON_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/daon-coach-silhouette.png');
const ION_COACH = require('@/src/shared/assets/images/battle/ion-coach.png');
const ION_COACH_SILHOUETTE = require('@/src/shared/assets/images/battle/ion-coach-silhouette.png');
const MAP_ORIGINAL_WIDTH = 1440;
const MAP_ORIGINAL_HEIGHT = 7648;
const MORU_DESIGN_WIDTH = 360;
const MORU_CENTER_X = 720;
const MORU_TOP = 6810;
const MORU_TOP_OFFSET = 90;
const COACH_DESIGN_WIDTH = 380;
const COACH_SELECTION_DELAY = 700;
const EXCLAMATION_WIDTH = scaleByDeviceWidth(65.52);
const EXCLAMATION_HEIGHT = scaleByDeviceWidth(56.1);
const COACHES = [
  {
    id: 'haru',
    name: '하루',
    order: 2,
    centerX: 310,
    top: 5530,
    image: HARU_COACH,
    silhouette: HARU_COACH_SILHOUETTE,
  },
  {
    id: 'nio',
    name: '니오',
    order: 3,
    centerX: 720,
    top: 4600,
    image: NIO_COACH,
    silhouette: NIO_COACH_SILHOUETTE,
  },
  {
    id: 'raon',
    name: '라온',
    order: 4,
    centerX: 336,
    top: 3690,
    image: RAON_COACH,
    silhouette: RAON_COACH_SILHOUETTE,
  },
  {
    id: 'byeoli',
    name: '별이',
    order: 5,
    centerX: 720,
    top: 2800,
    image: BYEOLI_COACH,
    silhouette: BYEOLI_COACH_SILHOUETTE,
  },
  {
    id: 'gaon',
    name: '가온',
    order: 6,
    centerX: 1104,
    top: 1910,
    image: GAON_COACH,
    silhouette: GAON_COACH_SILHOUETTE,
  },
  {
    id: 'daon',
    name: '다온',
    order: 7,
    centerX: 336,
    top: 1020,
    image: DAON_COACH,
    silhouette: DAON_COACH_SILHOUETTE,
  },
  {
    id: 'ion',
    name: '이온',
    order: 8,
    centerX: 720,
    top: 100,
    image: ION_COACH,
    silhouette: ION_COACH_SILHOUETTE,
  },
] as const;

type BattleMapScreenProps = {
  clearedCoachIds?: readonly string[];
};

export function BattleMapScreen({
  clearedCoachIds = [],
}: BattleMapScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const [isMoruSelected, setIsMoruSelected] = useState(false);
  const mapHeight = screenWidth * (MAP_ORIGINAL_HEIGHT / MAP_ORIGINAL_WIDTH);
  const moruWidth = screenWidth * (MORU_DESIGN_WIDTH / MAP_ORIGINAL_WIDTH);
  const moruLeft =
    screenWidth * (MORU_CENTER_X / MAP_ORIGINAL_WIDTH) - moruWidth / 2;
  const moruTop =
    mapHeight * (MORU_TOP / MAP_ORIGINAL_HEIGHT) -
    screenWidth * (MORU_TOP_OFFSET / 360);
  const coachWidth = screenWidth * (COACH_DESIGN_WIDTH / MAP_ORIGINAL_WIDTH);

  useFocusEffect(
    useCallback(() => {
      setIsMoruSelected(false);

      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }, []),
  );

  const handleMoruPress = () => {
    if (isMoruSelected) {
      return;
    }

    setIsMoruSelected(true);
    navigationTimeoutRef.current = setTimeout(() => {
      navigationTimeoutRef.current = null;
      setIsMoruSelected(false);
      router.push('/battle-moru');
    }, COACH_SELECTION_DELAY);
  };

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
            {COACHES.map((coach) => {
              const isCleared = clearedCoachIds.includes(coach.id);
              const left =
                screenWidth * (coach.centerX / MAP_ORIGINAL_WIDTH) -
                coachWidth / 2;
              const top = mapHeight * (coach.top / MAP_ORIGINAL_HEIGHT);

              return (
                <View
                  accessibilityLabel={
                    isCleared
                      ? `${coach.order}번째 관장 ${coach.name}`
                      : `잠긴 ${coach.order}번째 관장`
                  }
                  key={coach.id}
                  style={[
                    styles.coach,
                    {
                      top,
                      left,
                      width: coachWidth,
                      height: coachWidth,
                    },
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={isCleared ? coach.image : coach.silhouette}
                    style={styles.coachImage}
                  />
                  {!isCleared && (
                    <Text style={styles.lockedCoachQuestionMark}>?</Text>
                  )}
                </View>
              );
            })}
            <Pressable
              accessibilityLabel="땅 관장 모루에게 도전하기"
              accessibilityRole="button"
              accessibilityState={{ selected: isMoruSelected }}
              disabled={isMoruSelected}
              onPress={handleMoruPress}
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
              {isMoruSelected && (
                <View style={styles.coachSelectedExclamationPosition}>
                  <Animated.View entering={BounceIn.duration(350)}>
                    <Image
                      resizeMode="contain"
                      source={COACH_SELECTED_EXCLAMATION}
                      style={styles.coachSelectedExclamation}
                    />
                  </Animated.View>
                </View>
              )}
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
  coach: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lockedCoachQuestionMark: {
    color: '#FFFFFF',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(21),
    textAlign: 'center',
  },
  moruImage: {
    width: '100%',
    height: '100%',
  },
  coachSelectedExclamationPosition: {
    position: 'absolute',
    top: -scaleByDeviceWidth(42),
    left: '50%',
    transform: [{ translateX: -EXCLAMATION_WIDTH / 2 }],
  },
  coachSelectedExclamation: {
    width: EXCLAMATION_WIDTH,
    height: EXCLAMATION_HEIGHT,
  },
  pressed: {
    opacity: 0.8,
  },
});
