import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  FarmCreatureCard,
  useAnimals,
  type AnimalCardType,
  type CreatureEnvironment,
  type CreatureTier,
  type FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const SEARCH_INPUT = require('@/src/shared/assets/images/farm-search/animal-search-input.png');
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
const TIER_PRIORITY: Record<CreatureTier, number> = {
  C: 0,
  B: 1,
  A: 2,
  S: 3,
  SS: 4,
  SSS: 5,
};

type BattleCreatureSelectorProps = {
  onListInteractionEnd?: () => void;
  onListInteractionStart?: () => void;
  onSelectAnimal?: (animalId: number) => void;
};

export function BattleCreatureSelector({
  onListInteractionEnd,
  onListInteractionStart,
  onSelectAnimal,
}: BattleCreatureSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
  } = useAnimals({ enabled: true });
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
        tier: animal.tier,
      })),
    [animals],
  );
  const filteredCreatures = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');

    return creatures
      .filter((creature) => {
        const matchesType =
          selectedAnimalType === 'all' ||
          creature.environment === selectedAnimalType;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          creature.name
            .toLocaleLowerCase('ko-KR')
            .includes(normalizedQuery);

        return matchesType && matchesQuery;
      })
      .sort(
        (leftCreature, rightCreature) =>
          TIER_PRIORITY[rightCreature.tier] -
          TIER_PRIORITY[leftCreature.tier],
      );
  }, [creatures, searchQuery, selectedAnimalType]);

  return (
    <>
      <View style={styles.panel}>
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
        <ScrollView
          contentContainerStyle={styles.creatureListContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
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
        >
          <View style={styles.creatureGrid}>
            {filteredCreatures.map((creature) => (
              <FarmCreatureCard
                creature={creature}
                key={creature.id}
                onPress={
                  onSelectAnimal
                    ? () => onSelectAnimal(Number(creature.id))
                    : undefined
                }
              />
            ))}
          </View>
          {isLoading && (
            <ActivityIndicator
              color="#BCA47E"
              style={styles.loadingIndicator}
            />
          )}
        </ScrollView>
      </View>
      <ErrorModal message={errorMessage} onClose={clearError} />
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    width: scaleByDeviceWidth(328),
    height: scaleByDeviceWidth(432),
    alignItems: 'center',
    borderRadius: scaleByDeviceWidth(20),
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
    position: 'absolute',
    top: scaleByDeviceWidth(102),
    left: scaleByDeviceWidth(10),
    width: scaleByDeviceWidth(308),
    height: scaleByDeviceWidth(302),
  },
  creatureListContent: {
    paddingBottom: scaleByDeviceWidth(8),
  },
  creatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: scaleByDeviceWidth(4),
    rowGap: scaleByDeviceWidth(4),
  },
  loadingIndicator: {
    marginVertical: scaleByDeviceWidth(12),
  },
});
