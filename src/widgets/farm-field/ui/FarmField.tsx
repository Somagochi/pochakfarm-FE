import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated,
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
import type { FarmAnimal, FarmFloor, FarmType } from '@/src/entities/farm';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { FarmAmbientEffects } from './FarmAmbientEffects';
import { SkyFarmCloudLayer } from './SkyFarmCloudLayer';

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
const BASE_SLOT_GAP = 26.6;
const SLOT_COUNT = 4;
const BACKGROUND_TRANSITION_DURATION_MS = 220;
const CREATURE_NAMEPLATE_IMAGE = require('@/src/shared/assets/images/farm/creature-nameplate.png');
const ANIMAL_IMAGE_PLACEHOLDER = require('@/src/shared/assets/images/farm/animal-image-placeholder.png');
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
  isReordering?: boolean;
  onMoveCreature?: (
    animalId: number,
    targetFloorNumber: number,
    targetSlotNumber: number,
  ) => void;
  onExpansionSuccess?: () => Promise<unknown>;
  onBackgroundReady?: () => void;
  onStartReordering?: () => void;
  onPressEmptySlot?: (floorNumber: number, slotNumber: number) => void;
  onPressCreature?: (
    animal: FarmAnimal,
    floorNumber: number,
    slotNumber: number,
  ) => void;
  selectedSlot?: { floorNumber: number; slotNumber: number } | null;
  selectionSlotImageSource?: ImageSourcePropType;
  selectedSlotImageSource?: ImageSourcePropType;
  width: number;
};

export function FarmField({
  environment,
  farmType,
  floors,
  isReordering = false,
  onMoveCreature,
  onExpansionSuccess,
  onBackgroundReady,
  onStartReordering,
  onPressEmptySlot,
  onPressCreature,
  selectedSlot,
  selectionSlotImageSource,
  selectedSlotImageSource,
  width,
}: FarmFieldProps) {
  const canvasRef = useRef<View>(null);
  const canvasOriginRef = useRef({ x: 0, y: 0 });
  const [draggedCreature, setDraggedCreature] = useState<{
    animal: FarmAnimal;
    floorNumber: number;
    pageX: number;
    pageY: number;
    slotNumber: number;
  } | null>(null);
  const [hasDraggedCreatureImageFailed, setHasDraggedCreatureImageFailed] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expansionFloorNumber, setExpansionFloorNumber] = useState<
    number | null
  >(null);
  const { expandFloor, isExpanding } = useExpandFarmFloor(farmType);
  const { background, unlock } = ENVIRONMENT_ASSETS[environment];
  const [displayedBackground, setDisplayedBackground] =
    useState<ImageSourcePropType>(background);
  const [incomingBackground, setIncomingBackground] =
    useState<ImageSourcePropType | null>(null);
  const backgroundTransitionOpacity = useRef(new Animated.Value(0)).current;
  const backgroundTransitionRef = useRef<Animated.CompositeAnimation | null>(
    null,
  );
  const { width: imageWidth, height: imageHeight } =
    Image.resolveAssetSource(background);
  const farmImageRatio = imageHeight / imageWidth;
  const canvasHeight = width * farmImageRatio;
  const uiScale = width / REFERENCE_SCREEN_WIDTH;
  const slotSize = BASE_SLOT_SIZE * uiScale;
  const slotGap = BASE_SLOT_GAP * uiScale;
  const rowWidth = slotSize * SLOT_COUNT + slotGap * (SLOT_COUNT - 1);

  useEffect(() => {
    if (background === displayedBackground) {
      return;
    }

    backgroundTransitionRef.current?.stop();
    backgroundTransitionOpacity.setValue(0);
    setIncomingBackground(background);
  }, [background, backgroundTransitionOpacity, displayedBackground]);

  useEffect(
    () => () => {
      backgroundTransitionRef.current?.stop();
    },
    [],
  );

  const handleIncomingBackgroundLoad = () => {
    const loadedBackground = incomingBackground;

    if (loadedBackground === null) {
      return;
    }

    backgroundTransitionRef.current?.stop();
    const transition = Animated.timing(backgroundTransitionOpacity, {
      toValue: 1,
      duration: BACKGROUND_TRANSITION_DURATION_MS,
      useNativeDriver: true,
    });
    backgroundTransitionRef.current = transition;
    transition.start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayedBackground(loadedBackground);
      onBackgroundReady?.();
      setIncomingBackground((currentBackground) =>
        currentBackground === loadedBackground ? null : currentBackground,
      );
      backgroundTransitionRef.current = null;
    });
  };

  const getDropTarget = (pageX: number, pageY: number) => {
    const x = pageX - canvasOriginRef.current.x;
    const y = pageY - canvasOriginRef.current.y;
    const rowLeft = (width - rowWidth) / 2;

    for (const { areaNumber, sourceCenterY } of FARM_AREAS) {
      const floor = floors.find(({ floorNum }) => floorNum === areaNumber);
      if (!floor?.unlocked) continue;

      const rowTop = (sourceCenterY / 2983) * canvasHeight - slotSize / 2;
      if (y < rowTop || y > rowTop + slotSize) continue;

      for (
        let slotNumber = 1;
        slotNumber <= SLOT_COUNT;
        slotNumber += 1
      ) {
        const slotLeft = rowLeft + (slotNumber - 1) * (slotSize + slotGap);
        if (x >= slotLeft && x <= slotLeft + slotSize) {
          return { floorNumber: areaNumber, slotNumber };
        }
      }
    }

    return null;
  };

  const handleExpandFloor = async () => {
    try {
      const isExpanded = await expandFloor();

      if (isExpanded) {
        await onExpansionSuccess?.();
        setExpansionFloorNumber(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '농장 공간을 확장하지 못했습니다.',
      );
    }
  };

  return (
    <View
      ref={canvasRef}
      style={[styles.canvas, { width, height: canvasHeight }]}
    >
      <Image
        resizeMode={displayedBackground === background ? 'contain' : 'cover'}
        source={displayedBackground}
        style={[styles.background, { width, height: canvasHeight }]}
      />
      {incomingBackground !== null && (
        <Animated.Image
          onLoad={handleIncomingBackgroundLoad}
          resizeMode="contain"
          source={incomingBackground}
          style={[
            styles.background,
            {
              width,
              height: canvasHeight,
              opacity: backgroundTransitionOpacity,
            },
          ]}
        />
      )}
      <FarmAmbientEffects
        environment={environment}
        height={canvasHeight}
        width={width}
      />
      <SkyFarmCloudLayer
        depth="background"
        environment={environment}
        height={canvasHeight}
        width={width}
      />
      <SkyFarmCloudLayer
        depth="foreground"
        environment={environment}
        height={canvasHeight}
        width={width}
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
                  animal,
                  animalId: animal.animalId,
                  animalImageSource: animal.animalImageUrl
                    ? { uri: animal.animalImageUrl }
                    : undefined,
                  animalImageUri: animal.animalImageUrl ?? undefined,
                  name: animal.animalName,
                  nameplateImageSource: CREATURE_NAMEPLATE_IMAGE,
                  slotNumber: slot.slotNum,
                }];
              })}
              draggingAnimalId={draggedCreature?.animal.animalId}
              isUnlockAvailable={
                floor?.unlocked === false &&
                (areaNumber === 1 || previousFloor?.unlocked === true)
              }
              isUnlockDisabled={isReordering}
              isUnlocked={floor?.unlocked === true}
              onPressCreature={onPressCreature}
              onCreatureDragEnd={(pageX, pageY) => {
                if (!draggedCreature) return;

                const target = getDropTarget(pageX, pageY);
                setDraggedCreature(null);
                if (
                  target &&
                  (target.floorNumber !== draggedCreature.floorNumber ||
                    target.slotNumber !== draggedCreature.slotNumber)
                ) {
                  onMoveCreature?.(
                    draggedCreature.animal.animalId,
                    target.floorNumber,
                    target.slotNumber,
                  );
                }
              }}
              onCreatureDragMove={(pageX, pageY) => {
                setDraggedCreature((current) =>
                  current ? { ...current, pageX, pageY } : null,
                );
              }}
              onCreatureDragStart={
                isReordering || onStartReordering
                  ? (animal, floorNumber, slotNumber, pageX, pageY) => {
                      if (!isReordering) onStartReordering?.();

                      canvasRef.current?.measureInWindow((x, y) => {
                        canvasOriginRef.current = { x, y };
                        setHasDraggedCreatureImageFailed(false);
                        setDraggedCreature({
                          animal,
                          floorNumber,
                          pageX,
                          pageY,
                          slotNumber,
                        });
                      });
                    }
                  : undefined
              }
              onPressSlot={(slotNumber) => {
                if (isReordering) return;

                if (onPressEmptySlot) {
                  onPressEmptySlot(areaNumber, slotNumber);
                  return;
                }

                router.push('/(tabs)/capture');
              }}
              onPressUnlock={() => {
                if (!isReordering) setExpansionFloorNumber(areaNumber);
              }}
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
      {isReordering && draggedCreature && (
        <View
          pointerEvents="none"
          style={[
            styles.draggedCreature,
            {
              left:
                draggedCreature.pageX -
                canvasOriginRef.current.x -
                40 * uiScale,
              top:
                draggedCreature.pageY -
                canvasOriginRef.current.y -
                36.5 * uiScale,
              width: 80 * uiScale,
              height: 73 * uiScale,
            },
          ]}
        >
          <Image
            defaultSource={ANIMAL_IMAGE_PLACEHOLDER}
            onError={() => setHasDraggedCreatureImageFailed(true)}
            resizeMode="contain"
            source={
              draggedCreature.animal.animalImageUrl &&
              !hasDraggedCreatureImageFailed
                ? { uri: draggedCreature.animal.animalImageUrl }
                : ANIMAL_IMAGE_PLACEHOLDER
            }
            style={styles.draggedCreatureImage}
          />
        </View>
      )}
      <FarmExpansionModal
        floorNumber={expansionFloorNumber}
        isConfirming={isExpanding}
        onClose={() => setExpansionFloorNumber(null)}
        onConfirm={() => void handleExpandFloor()}
      />
      <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  areaRow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  draggedCreature: {
    position: 'absolute',
    zIndex: 10,
    opacity: 0.9,
    transform: [{ scale: 1.08 }],
  },
  draggedCreatureImage: {
    width: '100%',
    height: '100%',
  },
});
