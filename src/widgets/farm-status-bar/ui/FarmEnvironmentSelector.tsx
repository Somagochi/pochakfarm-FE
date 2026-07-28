import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';

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
export type SelectableFarmEnvironment = FarmEnvironment;

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
    ENVIRONMENTS[0].source;

  const selectEnvironment = (environment: FarmEnvironment) => {
    onSelectEnvironment(environment);
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
    width: scaleByDeviceWidth(58.25),
    height: scaleByDeviceWidth(29.25),
  },
  menu: {
    width: scaleByDeviceWidth(264),
    height: scaleByDeviceWidth(80),
    marginTop: scaleByDeviceWidth(4.4),
  },
  menuImage: {
    position: 'absolute',
    width: scaleByDeviceWidth(264),
    height: scaleByDeviceWidth(80),
  },
  menuButtons: {
    height: '100%',
    paddingHorizontal: scaleByDeviceWidth(7),
    paddingVertical: scaleByDeviceWidth(7),
    flexDirection: 'row',
    gap: scaleByDeviceWidth(4),
  },
  menuButton: {
    width: scaleByDeviceWidth(59.5),
    height: scaleByDeviceWidth(66),
    borderRadius: scaleByDeviceWidth(4),
  },
  pressed: {
    opacity: 0.8,
  },
  menuButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
