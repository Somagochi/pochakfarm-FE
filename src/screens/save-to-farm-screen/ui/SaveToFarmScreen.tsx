import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type FarmAnimal,
  type FarmType,
  useFarm,
} from '@/src/entities/farm';
import { requestCaptureFlowReset } from '@/src/features/capture-photo';
import {
  SaveCreatureConfirmModal,
  usePlaceCapturedAnimal,
} from '@/src/features/save-creature';
import { ReplaceCreatureModal } from '@/src/features/replace-creature';
import { useSelectFarmSlot } from '@/src/features/select-farm-slot';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { FarmField } from '@/src/widgets/farm-field';

const EMPTY_SAVE_SLOT_IMAGE = require('@/src/shared/assets/images/farm/empty-save-slot.png');
const SELECTED_SAVE_SLOT_IMAGE = require('@/src/shared/assets/images/farm/selected-save-slot.png');
const SAVE_TITLE_IMAGE = require('@/src/shared/assets/images/farm/save-title.png');
const REMAINING_SPACE_IMAGE = require('@/src/shared/assets/images/farm/remaining-space-label.png');
const SAVE_SLOT_GUIDE_IMAGE = require('@/src/shared/assets/images/farm/save-slot-guide.png');
const CANCEL_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/cancel-save-to-farm-button.png');
const DISABLED_SAVE_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/save-to-selected-slot-button.png');
const ACTIVE_SAVE_BUTTON_IMAGE = require('@/src/shared/assets/images/farm/active-save-to-selected-slot-button.png');

const ENVIRONMENT_BY_FARM_TYPE = {
  GROUND: 'land',
  SEA: 'sea',
  SKY: 'sky',
  SPACE: 'space',
} as const;
const FARM_TYPES: FarmType[] = ['GROUND', 'SEA', 'SKY', 'SPACE'];

function isFarmType(value: string | string[] | undefined): value is FarmType {
  return typeof value === 'string' && FARM_TYPES.includes(value as FarmType);
}

export function SaveToFarmScreen() {
  const insets = useSafeAreaInsets();
  const farmScrollRef = useRef<ScrollView>(null);
  const {
    animalImageUrl,
    captureId: captureIdParam,
    cardImageUrl,
    cardType,
    farmType: farmTypeParam,
  } = useLocalSearchParams<{
    animalImageUrl?: string;
    captureId?: string;
    cardImageUrl?: string;
    cardType?: string;
    farmType?: string;
  }>();
  const captureId = Number(captureIdParam);
  const farmType = isFarmType(cardType)
    ? cardType
    : isFarmType(farmTypeParam)
      ? farmTypeParam
      : 'GROUND';
  const {
    clearError,
    errorMessage,
    farm,
    reload: reloadFarm,
  } = useFarm(farmType);
  const { clearSelection, selectedSlot, selectSlot } = useSelectFarmSlot();
  const { isLoading: isPlacingAnimal, placeAnimal } =
    usePlaceCapturedAnimal();
  const [isSaveConfirmVisible, setIsSaveConfirmVisible] = useState(false);
  const [replacementTarget, setReplacementTarget] = useState<{
    animal: FarmAnimal;
    floorNumber: number;
    slotNumber: number;
  } | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [fieldWidth, setFieldWidth] = useState(0);
  const slotSummary = useMemo(() => {
    const unlockedSlots = (farm?.floors ?? [])
      .filter((floor) => floor.unlocked)
      .flatMap((floor) => floor.slots);

    return {
      available: unlockedSlots.filter((slot) => slot.animal === null).length,
      total: unlockedSlots.length,
    };
  }, [farm]);

  const handlePlaceAnimal = async (
    floorNumber: number,
    slotNumber: number,
    replacedAnimalId: number | null,
  ) => {
    if (!Number.isFinite(captureId) || !animalImageUrl) {
      setPlacementError('저장할 포착 정보를 찾지 못했습니다.');
      return;
    }

    const result = await placeAnimal(captureId, {
      floorNum: floorNumber,
      slotNum: slotNumber,
      replacedAnimalId,
    });

    if (result.ok) {
      requestCaptureFlowReset();
      router.replace('/(tabs)/farm');
      return;
    }

    if (result.code === 'FARM_SLOT_OCCUPIED') {
      const nextFarm = await reloadFarm();
      const currentAnimal = nextFarm?.floors
        .find(({ floorNum }) => floorNum === floorNumber)
        ?.slots.find(({ slotNum }) => slotNum === slotNumber)?.animal;

      setIsSaveConfirmVisible(false);
      if (currentAnimal) {
        setReplacementTarget({
          animal: currentAnimal,
          floorNumber,
          slotNumber,
        });
      } else {
        setPlacementError(result.message);
      }
      return;
    }

    if (result.code === 'ANIMAL_REPLACEMENT_CONFLICT') {
      await reloadFarm();
      setReplacementTarget(null);
      clearSelection();
      setPlacementError(result.message);
      return;
    }

    if (result.code === 'CAPTURE_PLACEMENT_CONFLICT') {
      await reloadFarm();
      setIsSaveConfirmVisible(false);
      setReplacementTarget(null);
      clearSelection();
    }

    if (
      result.code === 'CAPTURE_NOT_PLACEABLE' ||
      result.code === 'CAPTURE_ALREADY_PLACED'
    ) {
      setIsSaveConfirmVisible(false);
      setReplacementTarget(null);
      clearSelection();
    }

    setPlacementError(result.message);
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingBottom: insets.bottom + scaleByDeviceWidth(12),
          paddingTop: insets.top + scaleByDeviceWidth(24),
        },
      ]}
    >
      <View style={styles.header}>
        <Image
          accessibilityLabel="저장하기"
          resizeMode="contain"
          source={SAVE_TITLE_IMAGE}
          style={styles.titleImage}
        />
        <View style={styles.remainingSpace}>
          <Image
            accessibilityLabel="남은 공간"
            resizeMode="contain"
            source={REMAINING_SPACE_IMAGE}
            style={styles.remainingLabelImage}
          />
          <Text style={styles.remainingCount}>
            {slotSummary.available}/{slotSummary.total}
          </Text>
        </View>
      </View>

      <View
        onLayout={(event) => setFieldWidth(event.nativeEvent.layout.width)}
        style={styles.farmViewport}
      >
        {fieldWidth > 0 && (
          <ScrollView
            bounces={false}
            onContentSizeChange={() => {
              farmScrollRef.current?.scrollToEnd({ animated: false });
            }}
            ref={farmScrollRef}
            showsVerticalScrollIndicator={false}
          >
            <FarmField
              environment={ENVIRONMENT_BY_FARM_TYPE[farmType]}
              farmType={farmType}
              floors={farm?.floors ?? []}
              onExpansionSuccess={reloadFarm}
              onPressEmptySlot={selectSlot}
              onPressCreature={(animal, floorNumber, slotNumber) => {
                setReplacementTarget({ animal, floorNumber, slotNumber });
              }}
              selectedSlot={selectedSlot}
              selectedSlotImageSource={SELECTED_SAVE_SLOT_IMAGE}
              selectionSlotImageSource={EMPTY_SAVE_SLOT_IMAGE}
              width={fieldWidth}
            />
          </ScrollView>
        )}
      </View>

      <Image
        accessibilityLabel="원하는 공간을 클릭 후 저장하세요"
        resizeMode="contain"
        source={SAVE_SLOT_GUIDE_IMAGE}
        style={styles.guideImage}
      />

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="저장 취소하기"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.actionButton,
            styles.cancelButton,
            pressed && styles.pressed,
          ]}
        >
          <Image
            resizeMode="contain"
            source={CANCEL_BUTTON_IMAGE}
            style={styles.actionButtonImage}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="선택한 농장 슬롯에 저장하기"
          accessibilityState={{ disabled: selectedSlot === null }}
          disabled={selectedSlot === null}
          onPress={() => setIsSaveConfirmVisible(true)}
          style={styles.actionButton}
        >
          <Image
            resizeMode="contain"
            source={
              selectedSlot
                ? ACTIVE_SAVE_BUTTON_IMAGE
                : DISABLED_SAVE_BUTTON_IMAGE
            }
            style={styles.actionButtonImage}
          />
        </Pressable>
      </View>

      <SaveCreatureConfirmModal
        errorMessage={
          isSaveConfirmVisible ? placementError ?? errorMessage : null
        }
        isConfirming={isPlacingAnimal}
        onClose={() => setIsSaveConfirmVisible(false)}
        onConfirm={() => {
          if (selectedSlot) {
            void handlePlaceAnimal(
              selectedSlot.floorNumber,
              selectedSlot.slotNumber,
              null,
            );
          }
        }}
        onErrorClose={() => {
          setPlacementError(null);
          clearError();
        }}
        visible={isSaveConfirmVisible}
      />
      <ReplaceCreatureModal
        animal={replacementTarget?.animal ?? null}
        capturedCardImageUrl={cardImageUrl}
        errorMessage={
          replacementTarget ? placementError ?? errorMessage : null
        }
        isConfirming={isPlacingAnimal}
        onClose={() => setReplacementTarget(null)}
        onConfirm={() => {
          if (replacementTarget) {
            void handlePlaceAnimal(
              replacementTarget.floorNumber,
              replacementTarget.slotNumber,
              replacementTarget.animal.animalId,
            );
          }
        }}
        onErrorClose={() => {
          setPlacementError(null);
          clearError();
        }}
      />
      <ErrorModal
        message={
          isSaveConfirmVisible || replacementTarget
            ? null
            : placementError ?? errorMessage
        }
        onClose={() => {
          setPlacementError(null);
          clearError();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FBF7EF',
    paddingHorizontal: scaleByDeviceWidth(16),
  },
  header: {
    width: '100%',
    height: scaleByDeviceWidth(28 + 13.69),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  titleImage: {
    width: scaleByDeviceWidth(79),
    height: scaleByDeviceWidth(28),
  },
  remainingSpace: {
    position: 'absolute',
    top: scaleByDeviceWidth(8.5),
    left: '50%',
    marginLeft: scaleByDeviceWidth(81),
    flexDirection: 'row',
    columnGap: scaleByDeviceWidth(6),
    alignItems: 'center',
  },
  remainingLabelImage: {
    width: scaleByDeviceWidth(46),
    height: scaleByDeviceWidth(11),
  },
  remainingCount: {
    height: scaleByDeviceWidth(11),
    color: '#A8A59D',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(11),
    lineHeight: scaleByDeviceWidth(11),
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: scaleByDeviceWidth(1) }],
  },
  farmViewport: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(16),
    backgroundColor: '#5CB33E',
  },
  guideImage: {
    width: scaleByDeviceWidth(267),
    height: scaleByDeviceWidth(28),
    marginTop: scaleByDeviceWidth(13.25),
  },
  actions: {
    width: '100%',
    marginTop: scaleByDeviceWidth(10.38),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: scaleByDeviceWidth(158),
    height: scaleByDeviceWidth(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cancelButton: {},
  pressed: {
    opacity: 0.7,
  },
});
