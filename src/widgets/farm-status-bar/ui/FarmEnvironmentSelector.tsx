import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

const ENVIRONMENTS = [
  {
    key: 'sky',
    label: '하늘',
    source: require('@/src/shared/assets/images/farm-status/sky-button.png'),
  },
  {
    key: 'land',
    label: '땅',
    source: require('@/src/shared/assets/images/farm-status/farm-action-button.png'),
  },
  {
    key: 'sea',
    label: '바다',
    source: require('@/src/shared/assets/images/farm-status/sea-button.png'),
  },
  {
    key: 'space',
    label: '우주',
    source: require('@/src/shared/assets/images/farm-status/space-button.png'),
  },
] as const satisfies readonly {
  key: string;
  label: string;
  source: ImageSourcePropType;
}[];

export type FarmEnvironment = (typeof ENVIRONMENTS)[number]['key'];
export type SelectableFarmEnvironment = Exclude<FarmEnvironment, 'sky'>;

const ENVIRONMENT_MENUS: Record<FarmEnvironment, ImageSourcePropType> = {
  sky: require('@/src/shared/assets/images/farm-status/environment-menu-sky.png'),
  land: require('@/src/shared/assets/images/farm-status/environment-menu-land.png'),
  sea: require('@/src/shared/assets/images/farm-status/environment-menu-sea.png'),
  space: require('@/src/shared/assets/images/farm-status/environment-menu-space.png'),
};

type FarmEnvironmentSelectorProps = {
  selectedEnvironment: SelectableFarmEnvironment;
  onSelectEnvironment: (environment: SelectableFarmEnvironment) => void;
};

export function FarmEnvironmentSelector({
  selectedEnvironment,
  onSelectEnvironment,
}: FarmEnvironmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSource =
    ENVIRONMENTS.find(({ key }) => key === selectedEnvironment)?.source ??
    ENVIRONMENTS[1].source;

  const selectEnvironment = (environment: FarmEnvironment) => {
    if (environment !== 'sky') {
      onSelectEnvironment(environment);
    }
    setIsOpen(false);
  };

  return (
    <View>
      <Pressable
        accessibilityLabel="농장 환경 선택"
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image
          resizeMode="contain"
          source={selectedSource}
          style={styles.currentButton}
        />
      </Pressable>

      {isOpen && (
        <View style={styles.menu}>
          <Image
            resizeMode="stretch"
            source={ENVIRONMENT_MENUS[selectedEnvironment]}
            style={styles.menuImage}
          />
          <View style={styles.menuButtons}>
            {ENVIRONMENTS.map(({ key, label }) => (
              <Pressable
                accessibilityLabel={`${label} 환경 선택`}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: key === 'sky',
                  selected: selectedEnvironment === key,
                }}
                disabled={key === 'sky'}
                key={key}
                onPress={() => selectEnvironment(key)}
                style={({ pressed }) => [
                  styles.menuButton,
                  key === 'sky' && styles.disabledMenuButton,
                  pressed && styles.menuButtonPressed,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  currentButton: {
    width: 58.25,
    height: 29.25,
  },
  menu: {
    width: 264,
    height: 80,
    marginTop: 4.4,
  },
  menuImage: {
    position: 'absolute',
    width: 264,
    height: 80,
  },
  menuButtons: {
    height: '100%',
    paddingHorizontal: 7,
    paddingVertical: 7,
    flexDirection: 'row',
    gap: 4,
  },
  menuButton: {
    width: 59.5,
    height: 66,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  menuButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  disabledMenuButton: {
    opacity: 0.45,
  },
});
