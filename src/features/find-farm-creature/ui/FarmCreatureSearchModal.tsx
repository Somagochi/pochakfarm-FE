import { useMemo, useState } from 'react';
import {
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
  type FarmCreatureListItem,
} from '@/src/entities/creature';
import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

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
const FARM_CREATURES: FarmCreatureListItem[] = [
  {
    creatureImageSource: require('@/src/shared/assets/images/farm/kkomi.png'),
    environment: 'land',
    id: 'kkomi',
    name: '꼬미',
    tier: 'S',
  },
];

type FarmCreatureSearchModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function FarmCreatureSearchModal({
  onClose,
  visible,
}: FarmCreatureSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnimalType, setSelectedAnimalType] = useState<
    (typeof ANIMAL_TYPES)[number]['value']
  >('all');
  const filteredCreatures = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');

    return FARM_CREATURES.filter((creature) => {
      const matchesType =
        selectedAnimalType === 'all' ||
        creature.environment === selectedAnimalType;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        creature.name
          .toLocaleLowerCase('ko-KR')
          .includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [searchQuery, selectedAnimalType]);

  return (
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
            data={filteredCreatures}
            keyExtractor={(creature) => creature.id}
            keyboardShouldPersistTaps="handled"
            numColumns={3}
            renderItem={({ item }) => (
              <FarmCreatureCard creature={item} />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.creatureList}
          />
        </ImageBackground>
      </View>
    </Modal>
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
  pressed: {
    opacity: 0.8,
  },
});
