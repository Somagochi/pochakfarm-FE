import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { setBottomTabBarHidden } from '@/src/shared/lib/navigation/bottomTabBarVisibility';
import { useRefreshOnFocus } from '@/src/shared/lib/navigation/useRefreshOnFocus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FarmCreatureSearchModal } from '@/src/features/find-farm-creature';
import { useMoveFarmCreature } from '@/src/features/move-farm-creature';
import { type FarmType, useFarm } from '@/src/entities/farm';
import { useUserProfile } from '@/src/entities/user';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { LoadingScreen } from '@/src/shared/ui/LoadingScreen';
import { CreatureDetailSheet } from '@/src/widgets/creature-detail-sheet';
import { FarmField } from '@/src/widgets/farm-field';
import {
  CoinBalanceBar,
  FarmEnvironmentSelector,
  FarmStatusBar,
  FarmUtilityButtons,
  type SelectableFarmEnvironment,
} from '@/src/widgets/farm-status-bar';

const FARM_TYPE_BY_ENVIRONMENT: Record<SelectableFarmEnvironment, FarmType> = {
  sky: 'SKY',
  land: 'GROUND',
  sea: 'SEA',
  space: 'SPACE',
};
const CLOSE_REORDER_BUTTON = require('@/src/shared/assets/images/capture/capture-close.png');
const SAVE_REORDER_BUTTON = require('@/src/shared/assets/images/farm-status/save-reorder-button.png');
const EMPTY_SAVE_SLOT_IMAGE = require('@/src/shared/assets/images/farm/empty-save-slot.png');

export function FarmScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const farmScrollRef = useRef<ScrollView>(null);
  const {
    clearError,
    errorMessage,
    profile,
    reload: reloadProfile,
  } = useUserProfile();
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<SelectableFarmEnvironment>('land');
  const [pendingEnvironment, setPendingEnvironment] =
    useState<SelectableFarmEnvironment | null>(null);
  const {
    clearError: clearFarmError,
    errorMessage: farmErrorMessage,
    farm,
    isLoading: isFarmLoading,
    reload: reloadFarm,
  } = useFarm(FARM_TYPE_BY_ENVIRONMENT[selectedEnvironment]);
  const [isEnvironmentChanging, setIsEnvironmentChanging] = useState(false);
  const [isFarmBackgroundReady, setIsFarmBackgroundReady] = useState(true);
  const [areFarmAnimalImagesReady, setAreFarmAnimalImagesReady] =
    useState(true);
  const [isCreatureDetailVisible, setIsCreatureDetailVisible] =
    useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<
    number | undefined
  >(undefined);
  const [isCreatureSearchVisible, setIsCreatureSearchVisible] =
    useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const {
    clearError: clearMoveError,
    errorMessage: moveErrorMessage,
    isMoving,
    moveCreature,
  } = useMoveFarmCreature();
  const [contentSize, setContentSize] = useState({
    height: 0,
    width: 0,
  });

  useRefreshOnFocus(async () => {
    await Promise.all([reloadFarm(), reloadProfile()]);
  });

  useEffect(() => {
    setBottomTabBarHidden(isReordering);

    return () => setBottomTabBarHidden(false);
  }, [isReordering]);

  useEffect(() => {
    if (!isEnvironmentChanging || pendingEnvironment === null) {
      return;
    }

    let secondFrameId: number | null = null;
    const firstFrameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        setSelectedEnvironment(pendingEnvironment);
        setPendingEnvironment(null);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== null) cancelAnimationFrame(secondFrameId);
    };
  }, [isEnvironmentChanging, pendingEnvironment]);

  useEffect(() => {
    if (
      !isEnvironmentChanging ||
      pendingEnvironment !== null ||
      farm?.type !== FARM_TYPE_BY_ENVIRONMENT[selectedEnvironment]
    ) {
      return;
    }

    let isCancelled = false;
    const animalImageUrls = farm.floors.flatMap((floor) =>
      floor.slots.flatMap((slot) =>
        slot.animal?.animalImageUrl ? [slot.animal.animalImageUrl] : [],
      ),
    );

    void Promise.allSettled(
      animalImageUrls.map((imageUrl) => Image.prefetch(imageUrl)),
    ).then(() => {
      if (!isCancelled) setAreFarmAnimalImagesReady(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [farm, isEnvironmentChanging, pendingEnvironment, selectedEnvironment]);

  useEffect(() => {
    if (
      isEnvironmentChanging &&
      isFarmBackgroundReady &&
      (areFarmAnimalImagesReady || farmErrorMessage !== null) &&
      !isFarmLoading &&
      (farm?.type === FARM_TYPE_BY_ENVIRONMENT[selectedEnvironment] ||
        farmErrorMessage !== null)
    ) {
      setIsEnvironmentChanging(false);
    }
  }, [
    areFarmAnimalImagesReady,
    farm?.type,
    farmErrorMessage,
    isEnvironmentChanging,
    isFarmBackgroundReady,
    isFarmLoading,
    selectedEnvironment,
  ]);

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setContentSize((currentSize) => {
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
      {contentSize.width > 0 && contentSize.height > 0 && (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => {
            farmScrollRef.current?.scrollToEnd({ animated: false });
          }}
          ref={farmScrollRef}
          scrollEnabled={!isReordering && !isMoving}
          showsVerticalScrollIndicator={false}
        >
          <FarmField
            environment={selectedEnvironment}
            farmType={FARM_TYPE_BY_ENVIRONMENT[selectedEnvironment]}
            floors={farm?.floors ?? []}
            isActive={isFocused}
            isReordering={isReordering}
            onBackgroundReady={() => setIsFarmBackgroundReady(true)}
            onMoveCreature={async (
              animalId,
              targetFloorNumber,
              targetSlotNumber,
            ) => {
              const didMove = await moveCreature(animalId, {
                floorNumber: targetFloorNumber,
                slotNumber: targetSlotNumber,
              });

              if (didMove) {
                await reloadFarm();
                setIsReordering(false);
              }
            }}
            onExpansionSuccess={async () => {
              await Promise.all([reloadFarm(), reloadProfile()]);
            }}
            onStartReordering={() => setIsReordering(true)}
            onPressCreature={
              isReordering
                ? undefined
                : (animal) => {
                    setSelectedAnimalId(animal.animalId);
                    setIsCreatureDetailVisible(true);
                  }
            }
            selectionSlotImageSource={
              isReordering ? EMPTY_SAVE_SLOT_IMAGE : undefined
            }
            width={contentSize.width}
          />
        </ScrollView>
      )}
      {!isReordering && (
        <View
          style={[
            styles.statusControls,
            { top: insets.top + scaleByDeviceWidth(2.2) },
          ]}
        >
          <FarmStatusBar
            level={profile?.level ?? 0}
            name={profile?.nickname ?? ''}
            onPress={() => router.push('/(tabs)/more')}
          />
          <View style={styles.actionButton}>
            <FarmEnvironmentSelector
              onSelectEnvironment={(environment) => {
                if (environment === selectedEnvironment) return;

                setIsEnvironmentChanging(true);
                setIsFarmBackgroundReady(false);
                setAreFarmAnimalImagesReady(false);
                setPendingEnvironment(environment);
              }}
              selectedEnvironment={selectedEnvironment}
            />
          </View>
        </View>
      )}
      {!isReordering && (
        <View
          style={[
            styles.rightControls,
            { top: insets.top + scaleByDeviceWidth(2.2) },
          ]}
        >
          <CoinBalanceBar balance={profile?.coins ?? 0} />
          <View style={styles.utilityButtons}>
            <FarmUtilityButtons
              onPressAnimalSwitch={() => setIsReordering(true)}
              onPressSearch={() => setIsCreatureSearchVisible(true)}
            />
          </View>
        </View>
      )}
      {isReordering && (
        <View
          pointerEvents="box-none"
          style={[
            styles.reorderControls,
            { top: insets.top + scaleByDeviceWidth(16) },
          ]}
        >
          <Pressable
            accessibilityLabel="동물 교체 취소"
            accessibilityRole="button"
            disabled={isMoving}
            onPress={() => setIsReordering(false)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Image source={CLOSE_REORDER_BUTTON} style={styles.closeButton} />
          </Pressable>
          <Pressable
            accessibilityLabel="동물 배치 저장"
            accessibilityRole="button"
            disabled={isMoving}
            onPress={() => setIsReordering(false)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Image source={SAVE_REORDER_BUTTON} style={styles.saveButton} />
          </Pressable>
        </View>
      )}
      <FarmCreatureSearchModal
        onClose={() => setIsCreatureSearchVisible(false)}
        onSelectAnimal={(animalId) => {
          setSelectedAnimalId(animalId);
          setIsCreatureSearchVisible(false);
          setIsCreatureDetailVisible(true);
        }}
        visible={isCreatureSearchVisible}
      />
      {isEnvironmentChanging && (
        <LoadingScreen
          accessibilityLabel="농장 환경 불러오는 중"
          style={styles.environmentLoadingOverlay}
        />
      )}
      {isCreatureDetailVisible && (
        <CreatureDetailSheet
          animalId={selectedAnimalId}
          onClose={() => {
            setIsCreatureDetailVisible(false);
            setSelectedAnimalId(undefined);
          }}
          onReleaseSuccess={async () => {
            await reloadFarm();
          }}
          width={contentSize.width}
        />
      )}
      <ErrorModal
        message={moveErrorMessage ?? farmErrorMessage ?? errorMessage}
        onClose={
          moveErrorMessage
            ? clearMoveError
            : farmErrorMessage
              ? clearFarmError
              : clearError
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  environmentLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  screen: {
    flex: 1,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#5CB33E',
    width: '100%',
  },
  statusControls: {
    position: 'absolute',
    left: scaleByDeviceWidth(12),
    zIndex: 2,
  },
  actionButton: {
    marginTop: scaleByDeviceWidth(4.4),
  },
  rightControls: {
    position: 'absolute',
    right: scaleByDeviceWidth(12),
    zIndex: 1,
  },
  utilityButtons: {
    marginTop: scaleByDeviceWidth(4.4),
    alignSelf: 'flex-end',
  },
  reorderControls: {
    position: 'absolute',
    left: scaleByDeviceWidth(18),
    right: scaleByDeviceWidth(18),
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: scaleByDeviceWidth(44),
    height: scaleByDeviceWidth(46.2),
  },
  saveButton: {
    width: scaleByDeviceWidth(80),
    height: scaleByDeviceWidth(42),
  },
  pressed: {
    opacity: 0.8,
  },
});
