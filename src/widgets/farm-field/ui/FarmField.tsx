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

const FARM_IMAGE = require('@/src/shared/assets/images/farm/farm-background.png');
const { width: imageWidth, height: imageHeight } =
  Image.resolveAssetSource(FARM_IMAGE);
const REFERENCE_SCREEN_WIDTH = 411;
const BASE_SLOT_SIZE = 58.4;
const FARM_IMAGE_RATIO = imageHeight / imageWidth;
const FARM_AREAS = [
  { areaNumber: 4, sourceCenterY: 700 },
  { areaNumber: 3, sourceCenterY: 1312 },
  { areaNumber: 2, sourceCenterY: 1954 },
  { areaNumber: 1, sourceCenterY: 2670 },
];

type FarmFieldProps = {
  width: number;
};

export function FarmField({ width }: FarmFieldProps) {
  const { isReady, unlockArea, unlockedAreaCount } = useFarmAreaUnlock();
  const canvasHeight = width * FARM_IMAGE_RATIO;
  const imageScale = width / imageWidth;
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
        source={FARM_IMAGE}
        style={{ width, height: canvasHeight }}
      />

      {FARM_AREAS.map(({ areaNumber, sourceCenterY }) => {
        return (
          <View
            key={areaNumber}
            style={[
              styles.areaRow,
              {
                top: sourceCenterY * imageScale - slotSize / 2,
              },
            ]}
          >
            <FarmAreaRow
              areaNumber={areaNumber}
              isUnlocked={areaNumber <= unlockedAreaCount}
              onPressSlot={() => router.push('/(tabs)/capture')}
              onPressUnlock={() => void handleUnlock(areaNumber)}
              scale={uiScale}
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
