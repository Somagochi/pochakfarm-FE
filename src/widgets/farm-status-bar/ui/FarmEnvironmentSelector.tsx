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
    key: 'land',
    label: '땅',
    offSource: require('@/src/shared/assets/images/farm-status/environment-land-off.png'),
    onSource: require('@/src/shared/assets/images/farm-status/environment-land-on.png'),
  },
  {
    key: 'sky',
    label: '하늘',
    offSource: require('@/src/shared/assets/images/farm-status/environment-sky-off.png'),
    onSource: require('@/src/shared/assets/images/farm-status/environment-sky-on.png'),
  },
  {
    key: 'sea',
    label: '바다',
    offSource: require('@/src/shared/assets/images/farm-status/environment-sea-off.png'),
    onSource: require('@/src/shared/assets/images/farm-status/environment-sea-on.png'),
  },
  {
    key: 'space',
    label: '우주',
    offSource: require('@/src/shared/assets/images/farm-status/environment-space-off.png'),
    onSource: require('@/src/shared/assets/images/farm-status/environment-space-on.png'),
  },
] as const satisfies readonly {
  key: string;
  label: string;
  offSource: ImageSourcePropType;
  onSource: ImageSourcePropType;
}[];

export type FarmEnvironment = (typeof ENVIRONMENTS)[number]['key'];
export type SelectableFarmEnvironment = FarmEnvironment;

type FarmEnvironmentSelectorProps = {
  selectedEnvironment: SelectableFarmEnvironment;
  onSelectEnvironment: (environment: SelectableFarmEnvironment) => void;
};

export function FarmEnvironmentSelector({
  selectedEnvironment,
  onSelectEnvironment,
}: FarmEnvironmentSelectorProps) {
  return (
    <View style={styles.container}>
      {ENVIRONMENTS.map(({ key, label, offSource, onSource }) => {
        const isSelected = selectedEnvironment === key;

        return (
          <Pressable
            accessibilityLabel={`${label} 환경 선택`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={key}
            onPress={() => onSelectEnvironment(key)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Image
              resizeMode="contain"
              source={isSelected ? onSource : offSource}
              style={styles.buttonImage}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  buttonImage: {
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(32),
  },
  pressed: {
    opacity: 0.8,
  },
});
