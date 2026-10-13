import { useEffect } from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const CLOUD_IMAGES = [
  require('@/src/shared/assets/images/farm/clouds/sky-cloud-full.png'),
  require('@/src/shared/assets/images/farm/clouds/sky-cloud-wide.png'),
] as const;

type CloudDepth = 'background' | 'foreground';

type CloudSpec = {
  delay: number;
  duration: number;
  imageIndex: number;
  left: number;
  opacity: number;
  top: number;
  travelX: number;
  travelY: number;
  width: number;
};

type SkyFarmCloudLayerProps = {
  depth: CloudDepth;
  environment: 'sky' | 'land' | 'sea' | 'space';
  height: number;
  width: number;
};

const CLOUD_SPECS: Record<CloudDepth, CloudSpec[]> = {
  background: [
    { delay: 0, duration: 32000, imageIndex: 0, left: -0.16, opacity: 0.62, top: 0.1, travelX: 0.42, travelY: 0.006, width: 0.42 },
    { delay: 4300, duration: 41000, imageIndex: 1, left: 0.58, opacity: 0.54, top: 0.28, travelX: -0.36, travelY: -0.005, width: 0.4 },
    { delay: 9100, duration: 37000, imageIndex: 1, left: 0.03, opacity: 0.58, top: 0.51, travelX: 0.34, travelY: 0.004, width: 0.44 },
    { delay: 2800, duration: 46000, imageIndex: 0, left: 0.61, opacity: 0.5, top: 0.73, travelX: -0.4, travelY: 0.005, width: 0.36 },
  ],
  foreground: [
    { delay: 1500, duration: 26000, imageIndex: 1, left: -0.22, opacity: 0.82, top: 0.34, travelX: 0.36, travelY: -0.003, width: 0.38 },
    { delay: 7200, duration: 30000, imageIndex: 0, left: 0.72, opacity: 0.78, top: 0.55, travelX: -0.32, travelY: 0.004, width: 0.3 },
    { delay: 3900, duration: 28000, imageIndex: 1, left: -0.12, opacity: 0.74, top: 0.77, travelX: 0.3, travelY: -0.004, width: 0.32 },
  ],
};

function FloatingCloud({
  canvasHeight,
  canvasWidth,
  reducedMotion,
  source,
  spec,
}: {
  canvasHeight: number;
  canvasWidth: number;
  reducedMotion: boolean;
  source: ImageSourcePropType;
  spec: CloudSpec;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }

    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: spec.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: spec.duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [progress, reducedMotion, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const driftWave = Math.sin(progress.value * Math.PI);
    const wriggleWave = Math.sin(progress.value * Math.PI * 4);
    const secondaryWriggle = Math.cos(progress.value * Math.PI * 3);

    return {
      transform: [
        { translateX: canvasWidth * spec.travelX * progress.value },
        { translateY: canvasHeight * spec.travelY * driftWave },
        { rotate: `${wriggleWave * 0.7}deg` },
        { scaleX: 1 + wriggleWave * 0.025 },
        { scaleY: 1 + secondaryWriggle * 0.018 },
      ],
    };
  });
  const cloudWidth = canvasWidth * spec.width;
  const { height: imageHeight, width: imageWidth } =
    Image.resolveAssetSource(source);

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          left: canvasWidth * spec.left,
          opacity: spec.opacity,
          top: canvasHeight * spec.top,
          width: cloudWidth,
          aspectRatio: imageWidth / imageHeight,
        },
        animatedStyle,
      ]}
    >
      <Image source={source} style={styles.cloudImage} />
    </Animated.View>
  );
}

export function SkyFarmCloudLayer({
  depth,
  environment,
  height,
  width,
}: SkyFarmCloudLayerProps) {
  const reducedMotion = useReducedMotion();

  if (environment !== 'sky') {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CLOUD_SPECS[depth].map((spec, index) => (
        <FloatingCloud
          canvasHeight={height}
          canvasWidth={width}
          key={`${depth}-${index}`}
          reducedMotion={reducedMotion}
          source={CLOUD_IMAGES[spec.imageIndex]}
          spec={spec}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cloud: {
    position: 'absolute',
  },
  cloudImage: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
});
