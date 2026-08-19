import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { useIsBottomTabBarHidden } from '@/src/shared/lib/navigation/bottomTabBarVisibility';

const TAB_BAR_CONTENT_HEIGHT = scaleByDeviceWidth(80);
const TAB_BAR_BACKGROUND_WIDTH = scaleByDeviceWidth(368);
const TAB_BAR_BACKGROUND = require('@/src/shared/assets/images/bottom-tab-bar/nav-bottom.png');
const CAPTURE_LABEL_IMAGE = require('@/src/shared/assets/images/bottom-tab-bar/capture-label.png');

type TabImages = {
  active: ImageSourcePropType;
  inactive: ImageSourcePropType;
};

const TAB_IMAGES: Record<string, TabImages> = {
  farm: {
    active: require('@/src/shared/assets/images/bottom-tab-bar/farm-tab.png'),
    inactive: require('@/src/shared/assets/images/bottom-tab-bar/farm-tab-inactive.png'),
  },
  collection: {
    active: require('@/src/shared/assets/images/bottom-tab-bar/collection-tab-active.png'),
    inactive: require('@/src/shared/assets/images/bottom-tab-bar/collection-tab.png'),
  },
  capture: {
    active: require('@/src/shared/assets/images/bottom-tab-bar/capture-tab.png'),
    inactive: require('@/src/shared/assets/images/bottom-tab-bar/capture-tab.png'),
  },
  battle: {
    active: require('@/src/shared/assets/images/bottom-tab-bar/battle-tab-active.png'),
    inactive: require('@/src/shared/assets/images/bottom-tab-bar/battle-tab.png'),
  },
  more: {
    active: require('@/src/shared/assets/images/bottom-tab-bar/more-tab-active.png'),
    inactive: require('@/src/shared/assets/images/bottom-tab-bar/more-tab.png'),
  },
};

const TAB_LABELS: Record<string, string> = {
  farm: '농장',
  collection: '도감',
  capture: '포착',
  battle: '대전',
  more: '더보기',
};

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const isHidden = useIsBottomTabBarHidden();
  const activeRoute = state.routes[state.index];

  if (
    isHidden ||
    activeRoute?.name === 'capture'
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundClip}>
        <Image
          resizeMode="stretch"
          source={TAB_BAR_BACKGROUND}
          style={styles.background}
        />
      </View>
      <View style={styles.buttonGroup}>
        {state.routes.map((route, index) => {
          const tabImages = TAB_IMAGES[route.name];

          if (!tabImages) {
            return null;
          }

          const isFocused = state.index === index;
          const imageSource = isFocused
            ? tabImages.active
            : tabImages.inactive;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              accessibilityLabel={
                options.tabBarAccessibilityLabel ?? TAB_LABELS[route.name]
              }
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              key={route.key}
              onLongPress={onLongPress}
              onPress={onPress}
              style={({ pressed }) => [
                route.name === 'capture'
                  ? styles.captureButton
                  : styles.tabButton,
                pressed && styles.pressed,
              ]}
            >
              {route.name === 'capture' ? (
                <>
                  <Image
                    resizeMode="contain"
                    source={imageSource}
                    style={styles.captureImage}
                  />
                  <Image
                    resizeMode="contain"
                    source={CAPTURE_LABEL_IMAGE}
                    style={styles.captureLabel}
                  />
                </>
              ) : (
                <Image
                  resizeMode="contain"
                  source={imageSource}
                  style={styles.tabImage}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TAB_BAR_CONTENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backgroundClip: {
    position: 'absolute',
    top: 0,
    width: scaleByDeviceWidth(368),
    height: TAB_BAR_CONTENT_HEIGHT,
    alignItems: 'center',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    width: TAB_BAR_BACKGROUND_WIDTH,
    height: TAB_BAR_CONTENT_HEIGHT,
  },
  buttonGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tabButton: {
    width: scaleByDeviceWidth(48),
    height: scaleByDeviceWidth(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(80),
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ translateY: scaleByDeviceWidth(-21) }],
  },
  tabImage: {
    width: scaleByDeviceWidth(48),
    height: scaleByDeviceWidth(38),
  },
  captureImage: {
    width: scaleByDeviceWidth(64),
    height: scaleByDeviceWidth(64),
  },
  captureLabel: {
    width: scaleByDeviceWidth(19),
    height: scaleByDeviceWidth(10),
    marginTop: scaleByDeviceWidth(6),
  },
  pressed: {
    opacity: 0.7,
  },
});
