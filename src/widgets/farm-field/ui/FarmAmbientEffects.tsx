import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
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

type FarmEnvironment = 'sky' | 'land' | 'sea' | 'space';

type FarmAmbientEffectsProps = {
  environment: FarmEnvironment;
  height: number;
  width: number;
};

type ParticleSpec = {
  delay: number;
  duration: number;
  left: number;
  size: number;
  top: number;
  travelX: number;
  travelY: number;
};

const PARTICLES: ParticleSpec[] = [
  { left: 0.08, top: 0.07, size: 2.2, travelX: 18, travelY: -34, delay: 0, duration: 6200 },
  { left: 0.23, top: 0.14, size: 1.4, travelX: -12, travelY: -25, delay: 900, duration: 5400 },
  { left: 0.46, top: 0.1, size: 2.8, travelX: 10, travelY: -42, delay: 1700, duration: 7100 },
  { left: 0.73, top: 0.18, size: 1.8, travelX: -16, travelY: -31, delay: 400, duration: 5900 },
  { left: 0.9, top: 0.26, size: 2.4, travelX: 9, travelY: -38, delay: 2400, duration: 6800 },
  { left: 0.15, top: 0.35, size: 1.7, travelX: -9, travelY: -29, delay: 1300, duration: 5700 },
  { left: 0.37, top: 0.42, size: 2.5, travelX: 17, travelY: -40, delay: 2900, duration: 7300 },
  { left: 0.65, top: 0.5, size: 1.5, travelX: -13, travelY: -26, delay: 600, duration: 5100 },
  { left: 0.84, top: 0.58, size: 2, travelX: 12, travelY: -35, delay: 2000, duration: 6400 },
  { left: 0.11, top: 0.66, size: 2.6, travelX: 14, travelY: -43, delay: 1100, duration: 7500 },
  { left: 0.31, top: 0.73, size: 1.6, travelX: -11, travelY: -28, delay: 3200, duration: 5600 },
  { left: 0.57, top: 0.81, size: 2.3, travelX: 15, travelY: -37, delay: 300, duration: 6700 },
  { left: 0.78, top: 0.88, size: 1.5, travelX: -14, travelY: -27, delay: 2200, duration: 5300 },
  { left: 0.94, top: 0.94, size: 2.4, travelX: -10, travelY: -41, delay: 1500, duration: 7000 },
];

const PARTICLE_COLORS: Record<FarmEnvironment, string> = {
  land: '#FFF4B8',
  sky: '#FFFFFF',
  sea: '#BDF6FF',
  space: '#DDD6FF',
};

const GLOW_COLORS: Record<FarmEnvironment, [string, string]> = {
  land: ['rgba(255, 247, 199, 0.2)', 'rgba(255, 247, 199, 0)'],
  sky: ['rgba(255, 255, 255, 0.17)', 'rgba(255, 255, 255, 0)'],
  sea: ['rgba(143, 236, 255, 0.13)', 'rgba(143, 236, 255, 0)'],
  space: ['rgba(174, 144, 255, 0.12)', 'rgba(174, 144, 255, 0)'],
};

function AmbientParticle({
  color,
  height,
  reducedMotion,
  spec,
  width,
}: {
  color: string;
  height: number;
  reducedMotion: boolean;
  spec: ParticleSpec;
  width: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.35;
      return;
    }

    progress.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, {
          duration: spec.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [progress, reducedMotion, spec.delay, spec.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const fade = Math.sin(progress.value * Math.PI);

    return {
      opacity: 0.16 + fade * 0.58,
      transform: [
        { translateX: spec.travelX * progress.value },
        { translateY: spec.travelY * progress.value },
        { scale: 0.72 + fade * 0.38 },
      ],
    };
  });

  const particleSize = width * (spec.size / 360);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          borderRadius: particleSize / 2,
          height: particleSize,
          left: width * spec.left,
          shadowColor: color,
          shadowRadius: particleSize,
          top: height * spec.top,
          width: particleSize,
        },
        animatedStyle,
      ]}
    />
  );
}

export function FarmAmbientEffects({
  environment,
  height,
  width,
}: FarmAmbientEffectsProps) {
  const reducedMotion = useReducedMotion();
  const glowOpacity = useSharedValue(0.68);

  useEffect(() => {
    if (reducedMotion) {
      glowOpacity.value = 0.68;
      return;
    }

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.58, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(glowOpacity);
  }, [glowOpacity, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.glow,
          { height: height * 0.28, width },
          glowStyle,
        ]}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect height={height * 0.28} width={width} x={0} y={0}>
            <LinearGradient
              colors={GLOW_COLORS[environment]}
              end={vec(width * 0.86, height * 0.28)}
              start={vec(0, 0)}
            />
          </Rect>
        </Canvas>
      </Animated.View>
      {PARTICLES.map((spec, index) => (
        <AmbientParticle
          color={PARTICLE_COLORS[environment]}
          height={height}
          key={`${environment}-${index}`}
          reducedMotion={reducedMotion}
          spec={spec}
          width={width}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
  },
});
