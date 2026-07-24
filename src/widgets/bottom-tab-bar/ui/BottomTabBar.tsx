import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_CONTENT_HEIGHT = 72;
const CAPTURE_LABEL_IMAGE = require('@/src/shared/assets/images/bottom-tab-bar/capture-label.png');

const TAB_IMAGES: Record<string, ImageSourcePropType> = {
  farm: require('@/src/shared/assets/images/bottom-tab-bar/farm-tab.png'),
  collection: require('@/src/shared/assets/images/bottom-tab-bar/collection-tab.png'),
  capture: require('@/src/shared/assets/images/bottom-tab-bar/capture-tab.png'),
  battle: require('@/src/shared/assets/images/bottom-tab-bar/battle-tab.png'),
  more: require('@/src/shared/assets/images/bottom-tab-bar/more-tab.png'),
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
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index];

  if (activeRoute?.name === 'capture') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.buttonGroup}>
        {state.routes.map((route, index) => {
          const imageSource = TAB_IMAGES[route.name];

          if (!imageSource) {
            return null;
          }

          const isFocused = state.index === index;
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
                isFocused ? styles.focused : styles.unfocused,
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
              {isFocused && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopColor: '#E5E7EB',
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  buttonGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tabButton: {
    width: 48,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 64,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ translateY: -21 }],
  },
  tabImage: {
    width: 48,
    height: 38,
  },
  captureImage: {
    width: 64,
    height: 64,
  },
  captureLabel: {
    width: 19,
    height: 10,
    marginTop: 6,
  },
  focused: {
    opacity: 1,
  },
  unfocused: {
    opacity: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 5,
    height: 5,
    backgroundColor: '#D99A00',
  },
  pressed: {
    opacity: 0.7,
  },
});
