import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { GestureDetector } from 'react-native-gesture-handler';
import Reanimated from 'react-native-reanimated';
import { useFarmCreatureDrag, type FarmDragSlot } from '@/src/features/move-farm-creature';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  FarmAreaRow,
  FarmExpansionModal,
  useExpandFarmFloor,
} from '@/src/features/unlock-farm-area';
import {
  getFarmAnimalImageKey,
  useFarmAnimalImages,
  type FarmAnimal,
  type FarmFloor,
  type FarmType,
} from '@/src/entities/farm';
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
  isActive?: boolean;
  isReordering?: boolean;
  isTransitionCovered?: boolean;
  onMoveCreature?: (
    animalId: number,
    targetFloorNumber: number,
    targetSlotNumber: number,
  ) => void;
  onExpansionSuccess?: () => Promise<unknown>;
  onBackgroundReady?: () => void;
  onAnimalImagesReady?: (ready: boolean) => void;
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
  isActive = true,
  isReordering = false,
  isTransitionCovered = false,
  onMoveCreature,
  onExpansionSuccess,
  onBackgroundReady,
  onAnimalImagesReady,
  onStartReordering,
  onPressEmptySlot,
  onPressCreature,
  selectedSlot,
  selectionSlotImageSource,
  selectedSlotImageSource,
  width,
}: FarmFieldProps) {
  const [hasDraggedCreatureImageFailed, setHasDraggedCreatureImageFailed] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingExpansionErrorMessage, setPendingExpansionErrorMessage] =
    useState<string | null>(null);
  const [expansionFloorNumber, setExpansionFloorNumber] = useState<
    number | null
  >(null);
  const { expandFloor, isExpanding } = useExpandFarmFloor(farmType);
  const { background, unlock } = ENVIRONMENT_ASSETS[environment];
  const backgroundRequest = useRef({ source: background, generation: 0 });
  if (backgroundRequest.current.source !== background) {
    backgroundRequest.current = {
      source: background,
      generation: backgroundRequest.current.generation + 1,
    };
  }
  const backgroundGeneration = backgroundRequest.current.generation;
  const loadedBackgrounds = useRef(new Set<ImageSourcePropType>());
  const notifiedBackgroundGeneration = useRef(-1);
  const backgroundReadyCallback = useRef(onBackgroundReady);
  backgroundReadyCallback.current = onBackgroundReady;
  const notifyBackgroundReady = useCallback(() => {
    if (
      backgroundRequest.current.generation !== backgroundGeneration ||
      notifiedBackgroundGeneration.current === backgroundGeneration
    ) return;
    notifiedBackgroundGeneration.current = backgroundGeneration;
    backgroundReadyCallback.current?.();
  }, [backgroundGeneration]);
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
  const visibleImageFloors = useMemo(
    () => floors.filter((floor) => FARM_AREAS.some(({ areaNumber }) => areaNumber === floor.floorNum)),
    [floors],
  );
  const {
    batchKey: animalImagesBatchKey,
    images: animalImages,
    isReady: areAnimalImagesReady,
    markDisplayed: markAnimalImageDisplayed,
    markFailed: markAnimalImageFailed,
  } = useFarmAnimalImages({
    type: farmType,
    floors: visibleImageFloors,
    imageWidth: 80 * uiScale,
    imageHeight: 73 * uiScale,
  });

  useEffect(() => {
    onAnimalImagesReady?.(areAnimalImagesReady);
  }, [animalImagesBatchKey, areAnimalImagesReady, onAnimalImagesReady]);

  useEffect(() => {
    backgroundTransitionRef.current?.stop();
    backgroundTransitionRef.current = null;
    if (background === displayedBackground) {
      setIncomingBackground(null);
      if (loadedBackgrounds.current.has(background)) notifyBackgroundReady();
      return;
    }

    backgroundTransitionOpacity.setValue(0);
    setIncomingBackground(background);
  }, [background, backgroundTransitionOpacity, displayedBackground, notifyBackgroundReady]);

  useEffect(
    () => () => {
      backgroundTransitionRef.current?.stop();
    },
    [],
  );

  const handleIncomingBackgroundLoad = () => {
    const loadedBackground = incomingBackground;
    if (loadedBackground !== null) loadedBackgrounds.current.add(loadedBackground);

    if (
      loadedBackground === null || loadedBackground !== background ||
      backgroundRequest.current.generation !== backgroundGeneration
    ) {
      return;
    }

    backgroundTransitionRef.current?.stop();
    const completeTransition = () => {
      if (backgroundRequest.current.generation !== backgroundGeneration) return;
      setDisplayedBackground(loadedBackground);
      notifyBackgroundReady();
      setIncomingBackground((currentBackground) =>
        currentBackground === loadedBackground ? null : currentBackground,
      );
      backgroundTransitionRef.current = null;
    };
    // 불투명 로딩 화면 뒤의 페이드는 보이지 않으므로 표시를 늦추지 않습니다.
    if (isTransitionCovered) {
      completeTransition();
      return;
    }
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

      completeTransition();
    });
  };

  const handleDisplayedBackgroundLoad = () => {
    loadedBackgrounds.current.add(displayedBackground);
    if (
      displayedBackground === background &&
      backgroundRequest.current.generation === backgroundGeneration
    ) {
      notifyBackgroundReady();
    }
  };
  const handleBackgroundError = (source: ImageSourcePropType) => {
    if (
      source !== background ||
      backgroundRequest.current.generation !== backgroundGeneration
    ) return;
    backgroundTransitionRef.current?.stop();
    setIncomingBackground(null);
    setErrorMessage('농장 배경을 불러오지 못했습니다. 다시 진입해 주세요.');
    // 오류 안내를 닫고 화면을 다시 진입할 수 있도록 로딩을 해제합니다.
    notifyBackgroundReady();
  };

  const dragSlots = useMemo<FarmDragSlot[]>(
    () => FARM_AREAS.flatMap(({ areaNumber, sourceCenterY }) => {
      const floor = floors.find(({ floorNum }) => floorNum === areaNumber);
      if (!floor?.unlocked) return [];

      return Array.from({ length: SLOT_COUNT }, (_, index) => ({
        animal: floor.slots.find(({ slotNum }) => slotNum === index + 1)
          ?.animal ?? null,
        floorNumber: areaNumber,
        slotNumber: index + 1,
        left: (width - rowWidth) / 2 + index * (slotSize + slotGap),
        top: (sourceCenterY / 2983) * canvasHeight - slotSize / 2,
        size: slotSize,
      }));
    }),
    [canvasHeight, floors, rowWidth, slotGap, slotSize, width],
  );
  const { canvasRef, draggedSlot, dragStyle, gesture } = useFarmCreatureDrag({
    enabled: isActive && (isReordering || onStartReordering !== undefined),
    slots: dragSlots,
    scale: uiScale,
    onStart: () => {
      setHasDraggedCreatureImageFailed(false);
      if (!isReordering) onStartReordering?.();
    },
    onMove: onMoveCreature,
  });
  const draggedCreature = draggedSlot?.animal;
  const draggedAnimalImageKey = draggedSlot && draggedCreature
    ? getFarmAnimalImageKey(
        draggedSlot.floorNumber,
        draggedSlot.slotNumber,
        draggedCreature,
      )
    : null;
  const preparedDraggedAnimalImage = draggedAnimalImageKey
    ? animalImages.get(draggedAnimalImageKey)
    : undefined;

  const handleExpandFloor = async () => {
    try {
      const isExpanded = await expandFloor();

      if (isExpanded) {
        await onExpansionSuccess?.();
        setExpansionFloorNumber(null);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '농장 공간을 확장하지 못했습니다.';

      setExpansionFloorNumber(null);

      if (Platform.OS === 'ios') {
        setPendingExpansionErrorMessage(message);
      } else {
        setErrorMessage(message);
      }
    }
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        collapsable={false}
        ref={canvasRef}
        style={[styles.canvas, { width, height: canvasHeight }]}
      >
        <Image
          onError={() => handleBackgroundError(displayedBackground)}
          onLoad={handleDisplayedBackgroundLoad}
          resizeMode={displayedBackground === background ? 'contain' : 'cover'}
          source={displayedBackground}
          style={[styles.background, { width, height: canvasHeight }]}
        />
        {incomingBackground !== null && (
          <Animated.Image
            onError={() => handleBackgroundError(incomingBackground)}
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
        {isActive && (
          <>
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
          </>
        )}

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
                animalImagesBatchKey={animalImagesBatchKey}
                creatureSlots={(floor?.slots ?? []).flatMap((slot) => {
                  const animal = slot.animal;
                  if (!animal) {
                    return [];
                  }

                  const animalImageKey = getFarmAnimalImageKey(
                    areaNumber,
                    slot.slotNum,
                    animal,
                  );
                  return [{
                    animal,
                    animalId: animal.animalId,
                    animalImageKey,
                    preparedAnimalImage: animalImages.get(animalImageKey),
                    name: animal.animalName,
                    nameplateImageSource: CREATURE_NAMEPLATE_IMAGE,
                    slotNumber: slot.slotNum,
                  }];
                })}
                draggingAnimalId={draggedCreature?.animalId}
                isUnlockAvailable={
                  floor?.unlocked === false &&
                  (areaNumber === 1 || previousFloor?.unlocked === true)
                }
                isUnlockDisabled={isReordering}
                isUnlocked={floor?.unlocked === true}
                onAnimalImageDisplayed={markAnimalImageDisplayed}
                onAnimalImageFailed={markAnimalImageFailed}
                onPressCreature={onPressCreature}
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
          <Reanimated.View
            pointerEvents="none"
            style={[
              styles.draggedCreature,
              {
                width: 80 * uiScale,
                height: 73 * uiScale,
              },
              dragStyle,
            ]}
          >
            <ExpoImage
              contentFit="contain"
              key={`${animalImagesBatchKey}:${draggedAnimalImageKey}:${preparedDraggedAnimalImage === undefined ? 'pending' : preparedDraggedAnimalImage === null || hasDraggedCreatureImageFailed ? 'fallback' : 'prepared'}`}
              onDisplay={() => {
                if (preparedDraggedAnimalImage !== undefined && draggedAnimalImageKey) {
                  markAnimalImageDisplayed(draggedAnimalImageKey);
                }
              }}
              onError={() => {
                if (preparedDraggedAnimalImage === undefined || !draggedAnimalImageKey) return;
                if (preparedDraggedAnimalImage === null || hasDraggedCreatureImageFailed) {
                  markAnimalImageDisplayed(draggedAnimalImageKey);
                  return;
                }
                setHasDraggedCreatureImageFailed(true);
                markAnimalImageFailed(draggedAnimalImageKey);
              }}
              recyclingKey={`${animalImagesBatchKey}:${draggedAnimalImageKey}`}
              source={
                preparedDraggedAnimalImage && !hasDraggedCreatureImageFailed
                  ? preparedDraggedAnimalImage
                  : ANIMAL_IMAGE_PLACEHOLDER
              }
              style={styles.draggedCreatureImage}
              transition={0}
            />
          </Reanimated.View>
        )}
        <FarmExpansionModal
          floorNumber={expansionFloorNumber}
          isConfirming={isExpanding}
          onClose={() => setExpansionFloorNumber(null)}
          onConfirm={() => void handleExpandFloor()}
          onDismiss={() => {
            if (pendingExpansionErrorMessage === null) return;

            setErrorMessage(pendingExpansionErrorMessage);
            setPendingExpansionErrorMessage(null);
          }}
        />
        <ErrorModal message={errorMessage} onClose={() => setErrorMessage(null)} />
      </View>
    </GestureDetector>
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
    top: 0,
    left: 0,
  },
  draggedCreatureImage: {
    width: '100%',
    height: '100%',
  },
});
