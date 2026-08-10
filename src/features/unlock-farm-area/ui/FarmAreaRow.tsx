import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRef, useState } from 'react';

import type { FarmAnimal } from '@/src/entities/farm';

const FARM_SLOT_IMAGE = require('@/src/shared/assets/images/farm/farm-slot.png');
const ANIMAL_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/animal-image-placeholder.png');
const BASE_SLOT_SIZE = 58.4;
const BASE_SLOT_GAP = 26.6;
const BASE_CREATURE_WIDTH = 80;
const BASE_CREATURE_HEIGHT = 73;
const BASE_CREATURE_TOP_OFFSET = 4;
const BASE_NAMEPLATE_WIDTH = 73;
const BASE_NAMEPLATE_HEIGHT = 24;
const BASE_NAMEPLATE_TOP_OFFSET = 5;
const SLOT_COUNT = 4;
const BASE_UNLOCK_IMAGE_WIDTH = 112;

type FarmAreaRowProps = {
  areaNumber: number;
  creatureSlots: {
    animal: FarmAnimal;
    animalId: number;
    animalImageSource?: ImageSourcePropType;
    animalImageUri?: string;
    name: string;
    nameplateImageSource: ImageSourcePropType;
    slotNumber: number;
  }[];
  draggingAnimalId?: number;
  isUnlockAvailable: boolean;
  isUnlockDisabled?: boolean;
  isUnlocked: boolean;
  onPressCreature?: (
    animal: FarmAnimal,
    floorNumber: number,
    slotNumber: number,
  ) => void;
  onCreatureDragEnd?: (pageX: number, pageY: number) => void;
  onCreatureDragMove?: (pageX: number, pageY: number) => void;
  onCreatureDragStart?: (
    animal: FarmAnimal,
    floorNumber: number,
    slotNumber: number,
    pageX: number,
    pageY: number,
  ) => void;
  onPressSlot: (slotNumber: number) => void;
  onPressUnlock: () => void;
  scale: number;
  selectedSlotNumber?: number;
  selectionSlotImageSource?: ImageSourcePropType;
  selectedSlotImageSource?: ImageSourcePropType;
  unlockImageSource: ImageSourcePropType;
};

export function FarmAreaRow({
  areaNumber,
  creatureSlots,
  draggingAnimalId,
  isUnlockAvailable,
  isUnlockDisabled = false,
  isUnlocked,
  onPressCreature,
  onCreatureDragEnd,
  onCreatureDragMove,
  onCreatureDragStart,
  onPressSlot,
  onPressUnlock,
  scale,
  selectedSlotNumber,
  selectionSlotImageSource,
  selectedSlotImageSource,
  unlockImageSource,
}: FarmAreaRowProps) {
  const draggingAnimalIdRef = useRef<number | null>(null);
  const [failedAnimalImageKeys, setFailedAnimalImageKeys] = useState<
    Set<string>
  >(() => new Set());
  const slotSize = BASE_SLOT_SIZE * scale;
  const slotGap = BASE_SLOT_GAP * scale;
  const rowWidth = slotSize * SLOT_COUNT + slotGap * (SLOT_COUNT - 1);
  const unlockImageWidth = BASE_UNLOCK_IMAGE_WIDTH * scale;
  const { width: sourceWidth, height: sourceHeight } =
    Image.resolveAssetSource(unlockImageSource);
  const unlockImageHeight =
    BASE_UNLOCK_IMAGE_WIDTH * (sourceHeight / sourceWidth) * scale;

  return (
    <View
      style={[
        styles.row,
        {
          columnGap: slotGap,
          width: rowWidth,
          height: slotSize,
        },
      ]}
    >
      {isUnlocked &&
        Array.from({ length: SLOT_COUNT }, (_, index) => {
          const slotNumber = index + 1;
          const creatureSlot = creatureSlots.find(
            (slot) => slot.slotNumber === slotNumber,
          );

          if (creatureSlot) {
            const animalImageKey =
              `${creatureSlot.animalId}:${creatureSlot.animalImageUri ?? ''}`;
            const hasAnimalImageFailed = failedAnimalImageKeys.has(
              animalImageKey,
            );
            const nameplateWidth = BASE_NAMEPLATE_WIDTH * scale;
            const nameplateHeight = BASE_NAMEPLATE_HEIGHT * scale;
            const animalWidth = BASE_CREATURE_WIDTH * scale;
            const animalHeight = BASE_CREATURE_HEIGHT * scale;

            return (
              <Pressable
                accessibilityLabel={`${creatureSlot.name} 농장 슬롯`}
                accessibilityRole="button"
                delayLongPress={350}
                key={slotNumber}
                onLongPress={(event) => {
                  if (!onCreatureDragStart) return;

                  draggingAnimalIdRef.current = creatureSlot.animalId;
                  onCreatureDragStart(
                    creatureSlot.animal,
                    areaNumber,
                    slotNumber,
                    event.nativeEvent.pageX,
                    event.nativeEvent.pageY,
                  );
                }}
                onPress={() =>
                  draggingAnimalIdRef.current === null &&
                  onPressCreature?.(creatureSlot.animal, areaNumber, slotNumber)
                }
                onTouchEnd={(event) => {
                  if (draggingAnimalIdRef.current === null) return;

                  draggingAnimalIdRef.current = null;
                  onCreatureDragEnd?.(
                    event.nativeEvent.pageX,
                    event.nativeEvent.pageY,
                  );
                }}
                onTouchMove={(event) => {
                  if (draggingAnimalIdRef.current !== null) {
                    onCreatureDragMove?.(
                      event.nativeEvent.pageX,
                      event.nativeEvent.pageY,
                    );
                  }
                }}
                style={({ pressed }) => [
                  styles.creatureSlot,
                  { width: slotSize, height: slotSize },
                  draggingAnimalId === creatureSlot.animalId &&
                    styles.draggingSource,
                  pressed && styles.pressed,
                ]}
              >
                {(!creatureSlot.animalImageSource ||
                  hasAnimalImageFailed) && (
                  <Image
                    resizeMode="contain"
                    source={ANIMAL_IMAGE_PLACEHOLDER}
                    style={[
                      styles.creatureImage,
                      {
                        top:
                          slotSize * 0.04 +
                          BASE_CREATURE_TOP_OFFSET * scale,
                        left: (slotSize - animalWidth) / 2,
                        width: animalWidth,
                        height: animalHeight,
                      },
                    ]}
                  />
                )}
                {creatureSlot.animalImageSource &&
                  !hasAnimalImageFailed && (
                  <Image
                    defaultSource={ANIMAL_IMAGE_PLACEHOLDER}
                    onError={() => {
                      setFailedAnimalImageKeys((currentKeys) => {
                        const nextKeys = new Set(currentKeys);
                        nextKeys.add(animalImageKey);
                        return nextKeys;
                      });
                    }}
                    resizeMode="contain"
                    source={creatureSlot.animalImageSource}
                    style={[
                      styles.creatureImage,
                      {
                        top:
                          slotSize * 0.04 +
                          BASE_CREATURE_TOP_OFFSET * scale,
                        left: (slotSize - animalWidth) / 2,
                        width: animalWidth,
                        height: animalHeight,
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.nameplate,
                    {
                      top:
                        -nameplateHeight * 0.62 -
                        BASE_NAMEPLATE_TOP_OFFSET * scale,
                      left: (slotSize - nameplateWidth) / 2,
                      width: nameplateWidth,
                      height: nameplateHeight,
                    },
                  ]}
                >
                  <Image
                    resizeMode="stretch"
                    source={creatureSlot.nameplateImageSource}
                    style={[
                      styles.nameplateImage,
                      {
                        width: nameplateWidth,
                        height: nameplateHeight,
                      },
                    ]}
                  />
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[
                      styles.creatureName,
                      {
                        fontSize: 12 * scale,
                        lineHeight: 12 * scale,
                      },
                    ]}
                  >
                    {creatureSlot.name}
                  </Text>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              accessibilityLabel={`${areaNumber}번째 농장 ${slotNumber}번째 포착 슬롯`}
              accessibilityRole="button"
              key={slotNumber}
              onPress={() => onPressSlot(slotNumber)}
              style={({ pressed }) => [
                styles.slotButton,
                { width: slotSize, height: slotSize },
                pressed && styles.pressed,
              ]}
            >
              <Image
                resizeMode="contain"
                source={
                  selectedSlotNumber === slotNumber &&
                  selectedSlotImageSource
                    ? selectedSlotImageSource
                    : selectionSlotImageSource ?? FARM_SLOT_IMAGE
                }
                style={{ width: slotSize, height: slotSize }}
              />
            </Pressable>
          );
        })}

      {isUnlockAvailable && (
        <Pressable
          accessibilityLabel={`${areaNumber}번째 농장 잠금 해제`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isUnlockDisabled }}
          disabled={isUnlockDisabled}
          onPress={onPressUnlock}
          style={({ pressed }) => [
            styles.unlockButton,
            {
              top: (slotSize - unlockImageHeight) / 2,
              left: (rowWidth - unlockImageWidth) / 2,
              width: unlockImageWidth,
              height: unlockImageHeight,
            },
            isUnlockDisabled && styles.unlockButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={unlockImageSource}
            style={styles.unlockImage}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  creatureSlot: {
    alignItems: 'center',
    overflow: 'visible',
  },
  creatureImage: {
    position: 'absolute',
  },
  draggingSource: {
    opacity: 0.25,
  },
  nameplate: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameplateImage: {
    position: 'absolute',
  },
  creatureName: {
    color: '#6B4B27',
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  slotButton: {},
  unlockButton: {
    position: 'absolute',
    zIndex: 2,
  },
  unlockButtonDisabled: {
    opacity: 0.3,
  },
  unlockImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
