import { router } from 'expo-router';
import {
  Alert,
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {
  FarmAreaRow,
  useFarmAreaUnlock,
} from '@/src/features/unlock-farm-area';

const ENVIRONMENT_ASSETS = {
  sky: {
    background: require('@/src/shared/assets/images/farm/sky-background.png'),
    unlock: require('@/src/shared/assets/images/farm/unlock-sky-area.png'),
  },
  land: {
    background: require('@/src/shared/assets/images/farm/farm-background.png'),
    unlock: require('@/src/shared/assets/images/farm/unlock-area.png'),
  },
  sea: {
    background: require('@/src/shared/assets/images/farm/sea-background.png'),
    unlock: require('@/src/shared/assets/images/farm/unlock-sea-area.png'),
  },
  space: {
    background: require('@/src/shared/assets/images/farm/space-background.png'),
    unlock: require('@/src/shared/assets/images/farm/unlock-space-area.png'),
  },
} as const;
const REFERENCE_SCREEN_WIDTH = 360;
const BASE_SLOT_SIZE = 58.4;
const KKOMI_IMAGE = require('@/src/shared/assets/images/farm/kkomi.png');
const CREATURE_NAMEPLATE_IMAGE = require('@/src/shared/assets/images/farm/creature-nameplate.png');
const FARM_AREAS = [
  { areaNumber: 4, sourceCenterY: 700 },
  { areaNumber: 3, sourceCenterY: 1312 },
  { areaNumber: 2, sourceCenterY: 1954 },
  { areaNumber: 1, sourceCenterY: 2670 },
];

type FarmFieldProps = {
  environment: 'sky' | 'land' | 'sea' | 'space';
  onPressCreature?: () => void;
  width: number;
};

export function FarmField({
  environment,
  onPressCreature,
  width,
}: FarmFieldProps) {
  const { background, unlock } = ENVIRONMENT_ASSETS[environment];
  const { width: imageWidth, height: imageHeight } =
    Image.resolveAssetSource(background);
  const { isReady, unlockArea, unlockedAreaCount } =
    useFarmAreaUnlock(environment);
  const farmImageRatio = imageHeight / imageWidth;
  const canvasHeight = width * farmImageRatio;
  const uiScale = width / REFERENCE_SCREEN_WIDTH;
  const slotSize = BASE_SLOT_SIZE * uiScale;

  const handleUnlock = async (areaNumber: number) => {
    if (!isReady) {
      return;
    }

    if (areaNumber !== unlockedAreaCount + 1) {
      Alert.alert(
        '아직 열 수 없어요',
        '바로 이전 농장 영역을 먼저 잠금 해제해 주세요.',
      );
      return;
    }

    const isUnlocked = await unlockArea(areaNumber);

    if (!isUnlocked) {
      Alert.alert(
        '잠금 해제 실패',
        '농장 영역을 열지 못했습니다. 다시 시도해 주세요.',
      );
    }
  };

  return (
    <View style={[styles.canvas, { width, height: canvasHeight }]}>
      <Image
        resizeMode="contain"
        source={background}
        style={{ width, height: canvasHeight }}
      />

      {FARM_AREAS.map(({ areaNumber, sourceCenterY }) => {
        return (
          <View
            key={areaNumber}
            style={[
              styles.areaRow,
              {
                top:
                  (sourceCenterY / 2983) * canvasHeight -
                  slotSize / 2,
              },
            ]}
          >
            <FarmAreaRow
              areaNumber={areaNumber}
              creatureSlot={
                environment === 'land' && areaNumber === 1
                  ? {
                      animalImageSource: KKOMI_IMAGE,
                      name: '꼬미',
                      nameplateImageSource:
                        CREATURE_NAMEPLATE_IMAGE,
                      slotNumber: 1,
                    }
                  : undefined
              }
              isUnlockAvailable={
                areaNumber === unlockedAreaCount + 1
              }
              isUnlocked={areaNumber <= unlockedAreaCount}
              onPressCreature={onPressCreature}
              onPressSlot={() => router.push('/(tabs)/capture')}
              onPressUnlock={() => void handleUnlock(areaNumber)}
              scale={uiScale}
              unlockImageSource={unlock}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
  },
  areaRow: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
