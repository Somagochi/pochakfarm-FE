import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  FarmCreatureCard,
  useSearchAnimals,
  type AnimalCardType,
  type CreatureEnvironment,
  type CreatureTier,
  type FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';

const SEARCH_PANEL = require('@/src/shared/assets/images/farm-search/animal-search-panel.png');
const SEARCH_TITLE = require('@/src/shared/assets/images/farm-search/animal-search-title.png');
const SEARCH_CLOSE_BUTTON = require('@/src/shared/assets/images/farm-search/animal-search-close-button.png');
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

type FarmCreatureSearchModalProps = {
  onClose: () => void;
  onSelectAnimal: (animalId: number) => void;
  visible: boolean;
};

export function FarmCreatureSearchModal({
  onClose,
  onSelectAnimal,
  visible,
}: FarmCreatureSearchModalProps) {
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
    enabled: visible,
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
        tier: animal.tier,
      })),
    [animals],
  );
  const sortedCreatures = useMemo(
    () =>
      [...creatures].sort(
        (leftCreature, rightCreature) =>
          TIER_PRIORITY[rightCreature.tier] -
          TIER_PRIORITY[leftCreature.tier],
      ),
    [creatures],
  );

  return (
    <>
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="동물 찾기 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <ImageBackground
          resizeMode="stretch"
          source={SEARCH_PANEL}
          style={styles.panel}
        >
          <Image
            resizeMode="contain"
            source={SEARCH_TITLE}
            style={styles.title}
          />
          <Pressable
            accessibilityLabel="동물 찾기 닫기"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <Image
              source={SEARCH_CLOSE_BUTTON}
              style={styles.closeButtonImage}
            />
          </Pressable>
          <ImageBackground
            resizeMode="stretch"
            source={SEARCH_INPUT}
            style={styles.searchInputBackground}
          >
            <Image
              source={SEARCH_ICON}
              style={styles.searchIcon}
            />
            {!searchQuery && (
              <Image
                resizeMode="contain"
                source={SEARCH_PLACEHOLDER}
                style={styles.searchPlaceholder}
              />
            )}
            <TextInput
              accessibilityLabel="농장 동물 검색"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              value={searchQuery}
            />
          </ImageBackground>
          <View style={styles.animalTypeTabs}>
            {ANIMAL_TYPES.map((animalType) => {
              const isSelected =
                selectedAnimalType === animalType.value;

              return (
                <Pressable
                  accessibilityLabel={`${animalType.label} 동물 보기`}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: isSelected,
                  }}
                  key={animalType.value}
                  onPress={() =>
                    setSelectedAnimalType(animalType.value)
                  }
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
          <FlatList
            columnWrapperStyle={styles.creatureListRow}
            contentContainerStyle={styles.creatureListContent}
            data={sortedCreatures}
            keyExtractor={(creature) => creature.id}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isLoading ? (
                <ActivityIndicator
                  color="#BCA47E"
                  style={styles.loadingIndicator}
                />
              ) : null
            }
            numColumns={3}
            onEndReached={hasNext ? loadNextPage : undefined}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
              <FarmCreatureCard
                creature={item}
                onPress={() => onSelectAnimal(Number(item.id))}
              />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.creatureList}
          />
        </ImageBackground>
      </View>
    </Modal>
    <ErrorModal message={errorMessage} onClose={clearError} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  panel: {
    width: scaleByDeviceWidth(340),
    height: scaleByDeviceWidth(680),
    alignItems: 'center',
  },
  title: {
    position: 'absolute',
    top: scaleByDeviceWidth(33),
    width: scaleByDeviceWidth(84),
    height: scaleByDeviceWidth(28),
  },
  closeButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(26),
    right: scaleByDeviceWidth(16),
  },
  closeButtonImage: {
    width: scaleByDeviceWidth(40),
    height: scaleByDeviceWidth(42),
  },
  searchInputBackground: {
    position: 'absolute',
    top: scaleByDeviceWidth(73),
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
    left: scaleByDeviceWidth(12),
    top: scaleByDeviceWidth(8),
    width: scaleByDeviceWidth(20),
    height: scaleByDeviceWidth(20),
  },
  searchPlaceholder: {
    position: 'absolute',
    left: scaleByDeviceWidth(40),
    top: scaleByDeviceWidth(12.5),
    width: scaleByDeviceWidth(125),
    height: scaleByDeviceWidth(11),
  },
  animalTypeTabs: {
    position: 'absolute',
    top: scaleByDeviceWidth(117),
    left: scaleByDeviceWidth(16),
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
    top: scaleByDeviceWidth(159),
    left: scaleByDeviceWidth(16),
    width: scaleByDeviceWidth(308),
    height: scaleByDeviceWidth(493),
  },
  creatureListContent: {
    paddingBottom: scaleByDeviceWidth(8),
    rowGap: scaleByDeviceWidth(4),
  },
  creatureListRow: {
    columnGap: scaleByDeviceWidth(4),
  },
  loadingIndicator: {
    marginVertical: scaleByDeviceWidth(12),
  },
  retryButton: {
    alignItems: 'center',
    paddingVertical: scaleByDeviceWidth(12),
  },
  retryText: {
    color: '#6D6252',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(12),
    lineHeight: scaleByDeviceWidth(17),
  },
  pressed: {
    opacity: 0.8,
  },
});
