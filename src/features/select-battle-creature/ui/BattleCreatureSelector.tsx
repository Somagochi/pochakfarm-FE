import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useSearchAnimals,
  type AnimalCardType,
  type CreatureEnvironment,
  type CreatureTier,
  type FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

import { BattleCreatureCard } from './BattleCreatureCard';

const SEARCH_INPUT = require('@/src/shared/assets/images/battle/battle-search-input.png');
const SEARCH_ICON = require('@/src/shared/assets/images/farm-search/search-icon.png');
const SEARCH_PLACEHOLDER = require('@/src/shared/assets/images/farm-search/search-placeholder.png');
const ANIMAL_TYPES = [
  { label: '전체', value: 'all' },
  { label: '하늘', value: 'sky' },
  { label: '땅', value: 'land' },
  { label: '바다', value: 'sea' },
  { label: '우주', value: 'space' },
] as const;
const ENVIRONMENT_BY_CARD_TYPE: Record<
  AnimalCardType,
  CreatureEnvironment
> = {
  GROUND: 'land',
  SEA: 'sea',
  SKY: 'sky',
  SPACE: 'space',
};
const CARD_TYPE_BY_ENVIRONMENT: Record<
  CreatureEnvironment,
  AnimalCardType
> = {
  land: 'GROUND',
  sea: 'SEA',
  sky: 'SKY',
  space: 'SPACE',
};
const TIER_PRIORITY: Record<CreatureTier, number> = {
  C: 0,
  B: 1,
  A: 2,
  S: 3,
  SS: 4,
  SSS: 5,
};

type BattleCreatureSelectorProps = {
  headerContent?: ReactNode;
  onListInteractionEnd?: () => void;
  onListInteractionStart?: () => void;
  onToggleCreature?: (creature: FarmCreatureListItem) => void;
  recommendedCreatureEnvironments?: readonly CreatureEnvironment[];
  selectedCreatureIds?: string[];
};

export function BattleCreatureSelector({
  headerContent,
  onListInteractionEnd,
  onListInteractionStart,
  onToggleCreature,
  recommendedCreatureEnvironments = [],
  selectedCreatureIds = [],
}: BattleCreatureSelectorProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedAnimalType, setSelectedAnimalType] = useState<
    (typeof ANIMAL_TYPES)[number]['value']
  >('all');
  const {
    animals,
    clearError,
    errorMessage,
    hasNext,
    isLoading,
    loadNextPage,
  } = useSearchAnimals({
    keyword: debouncedSearchQuery,
    type:
      selectedAnimalType === 'all'
        ? undefined
        : CARD_TYPE_BY_ENVIRONMENT[selectedAnimalType],
  });
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  const creatures = useMemo<FarmCreatureListItem[]>(
    () =>
      animals.map((animal) => ({
        creatureImageSource: animal.animalImageUrl
          ? { uri: animal.animalImageUrl }
          : undefined,
        creatureImageUri: animal.animalImageUrl ?? undefined,
        environment: ENVIRONMENT_BY_CARD_TYPE[animal.cardType],
        id: String(animal.animalId),
        name: animal.animalName,
        restEndsAt: animal.restEndsAt,
        tier: animal.tier,
      })),
    [animals],
  );
  const hasRestingCreature = creatures.some((creature) => {
    if (!creature.restEndsAt) {
      return false;
    }

    const restEndMs = Date.parse(creature.restEndsAt);
    return Number.isFinite(restEndMs) && restEndMs > nowMs;
  });
  useEffect(() => {
    if (!hasRestingCreature) {
      return;
    }

    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [hasRestingCreature]);
  const sortedCreatures = useMemo(
    () =>
      [...creatures].sort(
        (leftCreature, rightCreature) =>
          TIER_PRIORITY[rightCreature.tier] -
          TIER_PRIORITY[leftCreature.tier],
      ),
    [creatures],
  );
  const recommendationEffectCreatureIds = useMemo(() => {
    const recommendedCreatures = creatures
      .filter((creature) =>
        recommendedCreatureEnvironments.includes(creature.environment),
      )
      .sort(
        (leftCreature, rightCreature) =>
          TIER_PRIORITY[rightCreature.tier] -
          TIER_PRIORITY[leftCreature.tier],
      );

    return new Set(
      recommendedCreatures
        .slice(0, 3)
        .map((creature) => creature.id),
    );
  }, [creatures, recommendedCreatureEnvironments]);

  return (
    <>
      <FlatList
          columnWrapperStyle={styles.creatureRow}
          contentContainerStyle={styles.creatureListContent}
          data={sortedCreatures}
          initialNumToRender={6}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(creature) => creature.id}
          ListFooterComponent={
            <View style={styles.listFooter}>
              {isLoading && (
                <ActivityIndicator
                  color="#BCA47E"
                  style={styles.loadingIndicator}
                />
              )}
            </View>
          }
          ListHeaderComponent={
            <>
              {headerContent}
              <View style={styles.panelHeader}>
                <ImageBackground
                  resizeMode="stretch"
                  source={SEARCH_INPUT}
                  style={styles.searchInputBackground}
                >
                  <Image source={SEARCH_ICON} style={styles.searchIcon} />
                  {!searchQuery && (
                    <Image
                      resizeMode="contain"
                      source={SEARCH_PLACEHOLDER}
                      style={styles.searchPlaceholder}
                    />
                  )}
                  <TextInput
                    accessibilityLabel="대전 출전 동물 검색"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    value={searchQuery}
                  />
                </ImageBackground>
                <View style={styles.animalTypeTabs}>
                  {ANIMAL_TYPES.map((animalType) => {
                    const isSelected = selectedAnimalType === animalType.value;

                    return (
                      <Pressable
                        accessibilityLabel={`${animalType.label} 동물 보기`}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        key={animalType.value}
                        onPress={() => setSelectedAnimalType(animalType.value)}
                        style={[
                          styles.animalTypeTab,
                          isSelected
                            ? styles.selectedAnimalTypeTab
                            : styles.unselectedAnimalTypeTab,
                        ]}
                      >
                        <Text
                          style={[
                            styles.animalTypeLabel,
                            isSelected
                              ? styles.selectedAnimalTypeLabel
                              : styles.unselectedAnimalTypeLabel,
                          ]}
                        >
                          {animalType.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          }
          maxToRenderPerBatch={6}
          nestedScrollEnabled
          numColumns={2}
          onTouchCancel={onListInteractionEnd}
          onTouchEnd={onListInteractionEnd}
          onTouchStart={onListInteractionStart}
          onScroll={({ nativeEvent }) => {
            const distanceFromEnd =
              nativeEvent.contentSize.height -
              nativeEvent.layoutMeasurement.height -
              nativeEvent.contentOffset.y;

            if (
              hasNext &&
              !isLoading &&
              distanceFromEnd < scaleByDeviceWidth(120)
            ) {
              loadNextPage();
            }
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.creatureList}
          renderItem={({ item: creature }) => {
            const selectedIndex = selectedCreatureIds.indexOf(creature.id);

            return (
              <View style={styles.creatureGridItem}>
                <BattleCreatureCard
                  creature={creature}
                  hasRecommendationEffect={
                    recommendationEffectCreatureIds.has(creature.id)
                  }
                  nowMs={nowMs}
                  onPress={() => onToggleCreature?.(creature)}
                  selectionOrder={
                    selectedIndex >= 0 ? selectedIndex + 1 : undefined
                  }
                />
              </View>
            );
          }}
          windowSize={5}
        />
      <ErrorModal message={errorMessage} onClose={clearError} />
    </>
  );
}

const styles = StyleSheet.create({
  panelHeader: {
    position: 'relative',
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(102),
    alignItems: 'center',
    borderTopLeftRadius: scaleByDeviceWidth(20),
    borderTopRightRadius: scaleByDeviceWidth(20),
    backgroundColor: '#FFFDF8',
    overflow: 'hidden',
  },
  searchInputBackground: {
    position: 'absolute',
    top: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(308),
    height: scaleByDeviceWidth(36),
  },
  searchInput: {
    flex: 1,
    paddingLeft: scaleByDeviceWidth(40),
    paddingRight: scaleByDeviceWidth(12),
    paddingVertical: 0,
    color: '#332F27',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(18),
  },
  searchIcon: {
    position: 'absolute',
    top: scaleByDeviceWidth(8),
    left: scaleByDeviceWidth(12),
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
  },
  searchPlaceholder: {
    position: 'absolute',
    top: scaleByDeviceWidth(12.5),
    left: scaleByDeviceWidth(40),
    width: scaleByDeviceWidth(125),
    height: scaleByDeviceWidth(11),
  },
  animalTypeTabs: {
    position: 'absolute',
    top: scaleByDeviceWidth(60),
    left: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(308),
    height: scaleByDeviceWidth(34),
    flexDirection: 'row',
  },
  animalTypeTab: {
    flex: 1,
    alignItems: 'center',
    borderBottomWidth: scaleByDeviceWidth(2),
  },
  selectedAnimalTypeTab: {
    borderBottomColor: '#BCA47E',
  },
  unselectedAnimalTypeTab: {
    borderBottomColor: '#EEE6D5',
  },
  animalTypeLabel: {
    marginTop: scaleByDeviceWidth(5),
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(15),
    lineHeight: scaleByDeviceWidth(20),
  },
  selectedAnimalTypeLabel: {
    color: '#302F2A',
  },
  unselectedAnimalTypeLabel: {
    color: '#A6A299',
  },
  creatureList: {
    flex: 1,
  },
  creatureListContent: {
    alignItems: 'center',
    paddingTop: scaleByDeviceWidth(16),
    paddingBottom: scaleByDeviceWidth(8),
  },
  creatureRow: {
    width: scaleByDeviceWidth(328),
    paddingLeft: scaleByDeviceWidth(10),
    gap: scaleByDeviceWidth(8),
    backgroundColor: '#FFFDF8',
  },
  creatureGridItem: {
    marginBottom: scaleByDeviceWidth(8),
  },
  listFooter: {
    width: scaleByDeviceWidth(328),
    minHeight: scaleByDeviceWidth(20),
    borderBottomLeftRadius: scaleByDeviceWidth(20),
    borderBottomRightRadius: scaleByDeviceWidth(20),
    backgroundColor: '#FFFDF8',
  },
  loadingIndicator: {
    marginVertical: scaleByDeviceWidth(12),
  },
});
