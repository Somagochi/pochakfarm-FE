import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

import {
  FarmAreaRow,
  FarmExpansionModal,
  useExpandFarmFloor,
} from '@/src/features/unlock-farm-area';
import type { FarmFloor, FarmType } from '@/src/entities/farm';

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
const CREATURE_NAMEPLATE_IMAGE = require('@/src/shared/assets/images/farm/creature-nameplate.png');
const FARM_AREAS = [
  { areaNumber: 4, sourceCenterY: 700 },
  { areaNumber: 3, sourceCenterY: 1312 },
  { areaNumber: 2, sourceCenterY: 1954 },
  { areaNumber: 1, sourceCenterY: 2670 },
];

type FarmFieldProps = {
  environment: 'sky' | 'land' | 'sea' | 'space';
  farmType: FarmType;
  floors: FarmFloor[];
  onExpansionSuccess?: () => Promise<void>;
  onPressEmptySlot?: (floorNumber: number, slotNumber: number) => void;
  onPressCreature?: (animalId: number) => void;
  selectedSlot?: { floorNumber: number; slotNumber: number } | null;
  selectionSlotImageSource?: ImageSourcePropType;
  selectedSlotImageSource?: ImageSourcePropType;
  width: number;
};

export function FarmField({
  environment,
  farmType,
  floors,
  onExpansionSuccess,
  onPressEmptySlot,
  onPressCreature,
  selectedSlot,
  selectionSlotImageSource,
  selectedSlotImageSource,
  width,
}: FarmFieldProps) {
  const [expansionFloorNumber, setExpansionFloorNumber] = useState<
    number | null
  >(null);
  const { expandFloor, isExpanding } = useExpandFarmFloor(farmType);
  const { background, unlock } = ENVIRONMENT_ASSETS[environment];
  const { width: imageWidth, height: imageHeight } =
    Image.resolveAssetSource(background);
  const farmImageRatio = imageHeight / imageWidth;
  const canvasHeight = width * farmImageRatio;
  const uiScale = width / REFERENCE_SCREEN_WIDTH;
  const slotSize = BASE_SLOT_SIZE * uiScale;

  const handleExpandFloor = async () => {
    try {
      const isExpanded = await expandFloor();

      if (isExpanded) {
        await onExpansionSuccess?.();
        setExpansionFloorNumber(null);
      }
    } catch (error) {
      Alert.alert(
        '공간 확장 실패',
        error instanceof Error
          ? error.message
          : '농장 공간을 확장하지 못했습니다.',
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
        const floor = floors.find(
          ({ floorNum }) => floorNum === areaNumber,
        );
        const previousFloor = floors.find(
          ({ floorNum }) => floorNum === areaNumber - 1,
        );

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
              creatureSlots={(floor?.slots ?? []).flatMap((slot) => {
                const animal = slot.animal;
                if (!animal) {
                  return [];
                }

                return [{
                  animalId: animal.animalId,
                  animalImageSource: animal.animalImageUrl
                    ? { uri: animal.animalImageUrl }
                    : undefined,
                  name: animal.animalName,
                  nameplateImageSource: CREATURE_NAMEPLATE_IMAGE,
                  slotNumber: slot.slotNum,
                }];
              })}
              isUnlockAvailable={
                floor?.unlocked === false &&
                (areaNumber === 1 || previousFloor?.unlocked === true)
              }
              isUnlocked={floor?.unlocked === true}
              onPressCreature={onPressCreature}
              onPressSlot={(slotNumber) => {
                if (onPressEmptySlot) {
                  onPressEmptySlot(areaNumber, slotNumber);
                  return;
                }

                router.push('/(tabs)/capture');
              }}
              onPressUnlock={() => setExpansionFloorNumber(areaNumber)}
              scale={uiScale}
              selectedSlotNumber={
                selectedSlot?.floorNumber === areaNumber
                  ? selectedSlot.slotNumber
                  : undefined
              }
              selectionSlotImageSource={selectionSlotImageSource}
              selectedSlotImageSource={selectedSlotImageSource}
              unlockImageSource={unlock}
            />
          </View>
        );
      })}
      <FarmExpansionModal
        floorNumber={expansionFloorNumber}
        isConfirming={isExpanding}
        onClose={() => setExpansionFloorNumber(null)}
        onConfirm={() => void handleExpandFloor()}
      />
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
