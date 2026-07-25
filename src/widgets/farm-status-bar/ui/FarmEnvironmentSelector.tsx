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

type EnvironmentKey = (typeof ENVIRONMENTS)[number]['key'];

const ENVIRONMENT_MENUS: Record<EnvironmentKey, ImageSourcePropType> = {
  sky: require('@/src/shared/assets/images/farm-status/environment-menu-sky.png'),
  land: require('@/src/shared/assets/images/farm-status/environment-menu-land.png'),
  sea: require('@/src/shared/assets/images/farm-status/environment-menu-sea.png'),
  space: require('@/src/shared/assets/images/farm-status/environment-menu-space.png'),
};

export function FarmEnvironmentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<EnvironmentKey>('land');
  const selectedSource =
    ENVIRONMENTS.find(({ key }) => key === selectedEnvironment)?.source ??
    ENVIRONMENTS[1].source;

  const selectEnvironment = (environment: EnvironmentKey) => {
    setSelectedEnvironment(environment);
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
                  selected: selectedEnvironment === key,
                }}
                key={key}
                onPress={() => selectEnvironment(key)}
                style={({ pressed }) => [
                  styles.menuButton,
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
});
