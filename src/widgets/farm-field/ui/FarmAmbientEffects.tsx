import { useEffect } from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import {
  Canvas,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  type DerivedValue,
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
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

const LAND_AMBIENT_ASSETS = {
  birdFrames: [
    require('@/src/shared/assets/images/farm/ambient/bird-frame-1.png'),
    require('@/src/shared/assets/images/farm/ambient/bird-frame-2.png'),
    require('@/src/shared/assets/images/farm/ambient/bird-frame-3.png'),
  ],
  bush: require('@/src/shared/assets/images/farm/ambient/bush.png'),
  butterflyFrames: [
    require('@/src/shared/assets/images/farm/ambient/butterfly-frame-1.png'),
    require('@/src/shared/assets/images/farm/ambient/butterfly-frame-2.png'),
    require('@/src/shared/assets/images/farm/ambient/butterfly-frame-3.png'),
  ],
  cloudCool: require('@/src/shared/assets/images/farm/ambient/cloud-cool.png'),
  cloudWarm: require('@/src/shared/assets/images/farm/ambient/cloud-warm.png'),
  sparkles: require('@/src/shared/assets/images/farm/ambient/sparkles.png'),
  wildflowers: require('@/src/shared/assets/images/farm/ambient/wildflowers.png'),
} as const;

const SEA_AMBIENT_ASSETS = {
  coralFrames: [
    require('@/src/shared/assets/images/farm/ambient/sea/coral-frame-1.png'),
    require('@/src/shared/assets/images/farm/ambient/sea/coral-frame-2.png'),
    require('@/src/shared/assets/images/farm/ambient/sea/coral-frame-3.png'),
  ],
  fishFrames: [
    require('@/src/shared/assets/images/farm/ambient/sea/fish-frame-1.png'),
    require('@/src/shared/assets/images/farm/ambient/sea/fish-frame-2.png'),
    require('@/src/shared/assets/images/farm/ambient/sea/fish-frame-3.png'),
  ],
  tropicalFish: {
    blue: [
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-blue-frame-2.png'),
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-blue-frame-3.png'),
    ],
    green: [
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-green-frame-2.png'),
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-green-frame-3.png'),
    ],
    purple: [
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-purple-frame-2.png'),
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-purple-frame-3.png'),
    ],
    yellow: [
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-yellow-frame-2.png'),
      require('@/src/shared/assets/images/farm/ambient/sea/tropical-fish-yellow-frame-3.png'),
    ],
  },
} as const;

type LandDecorationProps = {
  delay?: number;
  duration: number;
  height: number;
  left: number;
  reducedMotion: boolean;
  source: ImageSourcePropType;
  top: number;
  variant: 'cloud' | 'plant' | 'sparkle';
  width: number;
};

function LandDecoration({
  delay = 0,
  duration,
  height,
  left,
  reducedMotion,
  source,
  top,
  variant,
  width,
}: LandDecorationProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );

    return () => cancelAnimation(progress);
  }, [delay, duration, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === 'cloud') {
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0.58, 0.8, 0.58]),
        transform: [
          { translateX: interpolate(progress.value, [0, 1], [-10, 16]) },
          { translateY: interpolate(progress.value, [0, 0.5, 1], [1, -2, 1]) },
        ],
      };
    }

    if (variant === 'sparkle') {
      return {
        opacity: interpolate(progress.value, [0, 0.45, 1], [0.08, 0.5, 0.08]),
        transform: [
          { translateY: interpolate(progress.value, [0, 1], [4, -5]) },
          { scale: interpolate(progress.value, [0, 0.5, 1], [0.96, 1.03, 0.96]) },
        ],
      };
    }

    return {
      transform: [
        { rotate: `${interpolate(progress.value, [0, 0.5, 1], [-1.8, 2, -1.8])}deg` },
        { translateY: interpolate(progress.value, [0, 0.5, 1], [0, -1.5, 0]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.landDecoration,
        { height, left, top, width },
        animatedStyle,
      ]}
    >
      <Image resizeMode="contain" source={source} style={styles.decorationImage} />
    </Animated.View>
  );
}

const BUTTERFLY_CYCLE_POINTS = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 1];

function FlyingButterfly({
  height,
  reducedMotion,
  width,
}: {
  height: number;
  reducedMotion: boolean;
  width: number;
}) {
  const cycle = useSharedValue(0);
  const scale = width / 360;
  const butterflySize = 38 * scale;

  useEffect(() => {
    if (reducedMotion) {
      cycle.value = 0.3;
      return;
    }

    cycle.value = withRepeat(
      withTiming(1, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => cancelAnimation(cycle);
  }, [cycle, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(cycle.value, BUTTERFLY_CYCLE_POINTS, [
          width * 0.72,
          width * 0.42,
          width * 0.12,
          width * 0.12,
          width * 0.46,
          width * 0.79,
          width * 0.79,
          width * 0.75,
          width * 0.72,
        ]),
      },
      {
        translateY: interpolate(cycle.value, BUTTERFLY_CYCLE_POINTS, [
          height * 0.62,
          height * 0.58,
          height * 0.68,
          height * 0.68,
          height * 0.72,
          height * 0.84,
          height * 0.84,
          height * 0.7,
          height * 0.62,
        ]),
      },
      {
        rotate: `${interpolate(cycle.value, BUTTERFLY_CYCLE_POINTS, [
          0, -7, -2, 0, 6, 2, 0, -4, 0,
        ])}deg`,
      },
    ],
  }));

  const activeFrameIndex = useDerivedValue(() => {
    const progress = cycle.value;
    const isLanded =
      (progress >= 0.24 && progress <= 0.36) ||
      (progress >= 0.6 && progress <= 0.72);

    if (isLanded || reducedMotion) {
      return 1;
    }

    const flapStep = Math.floor(progress * 72) % 4;

    return flapStep === 0 ? 0 : flapStep === 2 ? 1 : 2;
  });

  const frameOneStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 0 ? 1 : 0,
  }));
  const frameTwoStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 1 ? 1 : 0,
  }));
  const frameThreeStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 2 ? 1 : 0,
  }));
  const frameStyles = [frameOneStyle, frameTwoStyle, frameThreeStyle];

  return (
    <Animated.View
      style={[
        styles.flyingButterfly,
        { height: butterflySize, width: butterflySize },
        movementStyle,
      ]}
    >
      {LAND_AMBIENT_ASSETS.butterflyFrames.map((source, index) => (
        <Animated.Image
          key={index}
          resizeMode="contain"
          source={source}
          style={[styles.flyingFrame, frameStyles[index]]}
        />
      ))}
    </Animated.View>
  );
}

const BIRD_FLIGHT_POINTS = [0, 0.2, 0.42, 0.65, 0.83, 1];

function FlyingBird({
  height,
  reducedMotion,
  width,
}: {
  height: number;
  reducedMotion: boolean;
  width: number;
}) {
  const flight = useSharedValue(0);
  const scale = width / 360;
  const birdSize = 54 * scale;

  useEffect(() => {
    if (reducedMotion) {
      flight.value = 0.5;
      return;
    }

    flight.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 11000, easing: Easing.linear }),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(flight);
  }, [flight, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(flight.value, [0, 1], [
          -birdSize,
          width + birdSize * 0.2,
        ]),
      },
      {
        translateY: interpolate(flight.value, BIRD_FLIGHT_POINTS, [
          height * 0.095,
          height * 0.075,
          height * 0.13,
          height * 0.09,
          height * 0.155,
          height * 0.11,
        ]),
      },
      {
        rotate: `${interpolate(flight.value, BIRD_FLIGHT_POINTS, [
          -2, -5, 3, -3, 4, 0,
        ])}deg`,
      },
    ],
  }));

  const activeFrameIndex = useDerivedValue(() => {
    if (reducedMotion) {
      return 2;
    }

    const flapStep = Math.floor(flight.value * 44) % 4;

    return flapStep === 0 ? 0 : flapStep === 2 ? 1 : 2;
  });
  const frameOneStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 0 ? 1 : 0,
  }));
  const frameTwoStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 1 ? 1 : 0,
  }));
  const frameThreeStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 2 ? 1 : 0,
  }));
  const frameStyles = [frameOneStyle, frameTwoStyle, frameThreeStyle];

  return (
    <Animated.View
      style={[
        styles.flyingBird,
        { height: birdSize, width: birdSize },
        movementStyle,
      ]}
    >
      {LAND_AMBIENT_ASSETS.birdFrames.map((source, index) => (
        <Animated.Image
          key={index}
          resizeMode="contain"
          source={source}
          style={[styles.flyingFrame, frameStyles[index]]}
        />
      ))}
    </Animated.View>
  );
}

function LandAmbientDecorations({
  height,
  reducedMotion,
  width,
}: {
  height: number;
  reducedMotion: boolean;
  width: number;
}) {
  const scale = width / 360;

  return (
    <>
      <LandDecoration
        duration={12000}
        height={70 * scale}
        left={-24 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.cloudCool}
        top={height * 0.015}
        variant="cloud"
        width={190 * scale}
      />
      <LandDecoration
        delay={1400}
        duration={14500}
        height={58 * scale}
        left={196 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.cloudWarm}
        top={height * 0.055}
        variant="cloud"
        width={174 * scale}
      />
      <FlyingBird
        height={height}
        reducedMotion={reducedMotion}
        width={width}
      />
      <FlyingButterfly
        height={height}
        reducedMotion={reducedMotion}
        width={width}
      />
      <LandDecoration
        delay={900}
        duration={4100}
        height={68 * scale}
        left={-8 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.wildflowers}
        top={height * 0.345}
        variant="plant"
        width={68 * scale}
      />
      <LandDecoration
        delay={1500}
        duration={4700}
        height={76 * scale}
        left={292 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.bush}
        top={height * 0.615}
        variant="plant"
        width={76 * scale}
      />
      <LandDecoration
        delay={300}
        duration={3600}
        height={150 * scale}
        left={12 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.sparkles}
        top={height * 0.43}
        variant="sparkle"
        width={150 * scale}
      />
      <LandDecoration
        delay={1100}
        duration={4000}
        height={112 * scale}
        left={186 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.sparkles}
        top={height * 0.205}
        variant="sparkle"
        width={112 * scale}
      />
      <LandDecoration
        delay={2500}
        duration={4700}
        height={120 * scale}
        left={-18 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.sparkles}
        top={height * 0.585}
        variant="sparkle"
        width={120 * scale}
      />
      <LandDecoration
        delay={1800}
        duration={4300}
        height={138 * scale}
        left={210 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.sparkles}
        top={height * 0.74}
        variant="sparkle"
        width={138 * scale}
      />
      <LandDecoration
        delay={700}
        duration={4400}
        height={104 * scale}
        left={82 * scale}
        reducedMotion={reducedMotion}
        source={LAND_AMBIENT_ASSETS.sparkles}
        top={height * 0.885}
        variant="sparkle"
        width={104 * scale}
      />
    </>
  );
}

function SeaFrameImages<FrameIndex extends number>({
  activeFrameIndex,
  frames,
}: {
  activeFrameIndex: DerivedValue<FrameIndex>;
  frames: readonly ImageSourcePropType[];
}) {
  const frameOneStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 0 ? 1 : 0,
  }));
  const frameTwoStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 1 ? 1 : 0,
  }));
  const frameThreeStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 2 ? 1 : 0,
  }));
  const frameStyles = [frameOneStyle, frameTwoStyle, frameThreeStyle];

  return frames.map((source, index) => (
    <Animated.Image
      key={index}
      resizeMode="contain"
      source={source}
      style={[styles.flyingFrame, frameStyles[index]]}
    />
  ));
}

type TropicalFrameAdjustment = {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};

function TropicalFishFrames<FrameIndex extends number>({
  activeFrameIndex,
  frames,
  secondFrameAdjustment,
}: {
  activeFrameIndex: DerivedValue<FrameIndex>;
  frames: readonly ImageSourcePropType[];
  secondFrameAdjustment: TropicalFrameAdjustment;
}) {
  const firstFrameStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 0 ? 1 : 0,
  }));
  const secondFrameStyle = useAnimatedStyle(() => ({
    opacity: activeFrameIndex.value === 1 ? 1 : 0,
  }));

  return (
    <>
      <Animated.Image
        resizeMode="contain"
        source={frames[0]}
        style={[styles.flyingFrame, firstFrameStyle]}
      />
      <Animated.Image
        resizeMode="contain"
        source={frames[1]}
        style={[
          styles.flyingFrame,
          {
            transform: [
              { translateX: secondFrameAdjustment.translateX },
              { translateY: secondFrameAdjustment.translateY },
              { scaleX: secondFrameAdjustment.scaleX },
              { scaleY: secondFrameAdjustment.scaleY },
            ],
          },
          secondFrameStyle,
        ]}
      />
    </>
  );
}

function SwimmingFish({
  delay,
  duration,
  height,
  reducedMotion,
  size,
  top,
  width,
}: {
  delay: number;
  duration: number;
  height: number;
  reducedMotion: boolean;
  size: number;
  top: number;
  width: number;
}) {
  const progress = useSharedValue(0);
  const fishSize = width * (size / 360);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.48;
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [delay, duration, progress, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [
          -fishSize,
          width + fishSize * 0.1,
        ]),
      },
      {
        translateY:
          height * top + Math.sin(progress.value * Math.PI * 4) * height * 0.025,
      },
      { rotate: `${Math.sin(progress.value * Math.PI * 4) * 2}deg` },
    ],
  }));
  const activeFrameIndex = useDerivedValue(() =>
    reducedMotion ? 1 : Math.floor(progress.value * 36) % 3,
  );

  return (
    <Animated.View
      style={[
        styles.seaMovingElement,
        { height: fishSize, width: fishSize },
        movementStyle,
      ]}
    >
      <SeaFrameImages
        activeFrameIndex={activeFrameIndex}
        frames={SEA_AMBIENT_ASSETS.fishFrames}
      />
    </Animated.View>
  );
}

function SwimmingTropicalFish({
  height,
  reducedMotion,
  width,
}: {
  height: number;
  reducedMotion: boolean;
  width: number;
}) {
  const progress = useSharedValue(0);
  const finMotion = useSharedValue(0);
  const schoolWidth = width * (104 / 360);
  const schoolHeight = schoolWidth * (82 / 104);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.46;
      finMotion.value = 0.5;
      return;
    }

    progress.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 17500, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    finMotion.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(finMotion);
    };
  }, [finMotion, progress, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [
          -schoolWidth,
          width + schoolWidth * 0.1,
        ]),
      },
      {
        translateY:
          height * 0.2 + Math.sin(progress.value * Math.PI * 4) * height * 0.018,
      },
      { rotate: `${Math.sin(progress.value * Math.PI * 4) * 1.6}deg` },
    ],
  }));
  const blueFishStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          finMotion.value,
          [0, 1],
          [-schoolWidth * 0.008, schoolWidth * 0.008],
        ),
      },
    ],
  }));
  const yellowFishStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          finMotion.value,
          [0, 1],
          [schoolWidth * 0.007, -schoolWidth * 0.007],
        ),
      },
    ],
  }));
  const greenFishStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: -1 },
      {
        translateY: interpolate(
          finMotion.value,
          [0, 1],
          [-schoolWidth * 0.006, schoolWidth * 0.006],
        ),
      },
    ],
  }));
  const purpleFishStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          finMotion.value,
          [0, 1],
          [schoolWidth * 0.0075, -schoolWidth * 0.0075],
        ),
      },
    ],
  }));
  const forwardFrameIndex = useDerivedValue(() =>
    finMotion.value < 0.5 ? 0 : 1,
  );
  const reverseFrameIndex = useDerivedValue(() =>
    finMotion.value < 0.5 ? 1 : 0,
  );

  return (
    <Animated.View
      style={[
        styles.seaMovingElement,
        { height: schoolHeight, width: schoolWidth },
        movementStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.tropicalFish,
          {
            height: schoolWidth * 0.42,
            left: schoolWidth * 0.29,
            top: 0,
            width: schoolWidth * 0.42,
          },
          blueFishStyle,
        ]}
      >
        <TropicalFishFrames
          activeFrameIndex={forwardFrameIndex}
          frames={SEA_AMBIENT_ASSETS.tropicalFish.blue}
          secondFrameAdjustment={{
            scaleX: 1.04,
            scaleY: 0.957,
            translateX: -schoolWidth * 0.003,
            translateY: -schoolWidth * 0.011,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.tropicalFish,
          {
            height: schoolWidth * 0.38,
            left: 0,
            top: schoolHeight * 0.32,
            width: schoolWidth * 0.38,
          },
          yellowFishStyle,
        ]}
      >
        <TropicalFishFrames
          activeFrameIndex={reverseFrameIndex}
          frames={SEA_AMBIENT_ASSETS.tropicalFish.yellow}
          secondFrameAdjustment={{
            scaleX: 1.106,
            scaleY: 1.185,
            translateX: schoolWidth * 0.018,
            translateY: 0,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.tropicalFish,
          {
            height: schoolWidth * 0.36,
            left: schoolWidth * 0.34,
            top: schoolHeight * 0.48,
            width: schoolWidth * 0.36,
          },
          greenFishStyle,
        ]}
      >
        <TropicalFishFrames
          activeFrameIndex={forwardFrameIndex}
          frames={SEA_AMBIENT_ASSETS.tropicalFish.green}
          secondFrameAdjustment={{
            scaleX: 0.897,
            scaleY: 0.986,
            translateX: -schoolWidth * 0.005,
            translateY: -schoolWidth * 0.005,
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.tropicalFish,
          {
            height: schoolWidth * 0.36,
            left: schoolWidth * 0.64,
            top: schoolHeight * 0.27,
            width: schoolWidth * 0.36,
          },
          purpleFishStyle,
        ]}
      >
        <TropicalFishFrames
          activeFrameIndex={reverseFrameIndex}
          frames={SEA_AMBIENT_ASSETS.tropicalFish.purple}
          secondFrameAdjustment={{
            scaleX: 0.92,
            scaleY: 0.914,
            translateX: schoolWidth * 0.024,
            translateY: 0,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

function RisingBubbles({
  delay,
  height,
  left,
  reducedMotion,
  size,
  top,
  width,
}: {
  delay: number;
  height: number;
  left: number;
  reducedMotion: boolean;
  size: number;
  top: number;
  width: number;
}) {
  const progress = useSharedValue(0);
  const bubbleSize = width * (size / 360);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.45;
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 8500, easing: Easing.linear }),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(progress);
  }, [delay, progress, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.82, 1], [0, 0.9, 0.9, 0]),
    transform: [
      { translateY: -height * 0.22 * progress.value },
      { translateX: Math.sin(progress.value * Math.PI * 3) * width * 0.025 },
      { scale: interpolate(progress.value, [0, 1], [0.88, 1.04]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.seaMovingElement,
        {
          height: bubbleSize,
          left: width * left,
          top: height * top,
          width: bubbleSize,
        },
        movementStyle,
      ]}
    >
      {[
        { left: 0.38, size: 0.3, top: 0.08 },
        { left: 0.58, size: 0.18, top: 0.29 },
        { left: 0.25, size: 0.2, top: 0.47 },
        { left: 0.53, size: 0.38, top: 0.57 },
        { left: 0.32, size: 0.14, top: 0.82 },
      ].map((bubble, index) => {
        const diameter = bubbleSize * bubble.size;

        return (
          <View
            key={index}
            style={[
              styles.seaBubble,
              {
                borderRadius: diameter / 2,
                borderWidth: bubbleSize * 0.018,
                height: diameter,
                left: bubbleSize * bubble.left,
                top: bubbleSize * bubble.top,
                width: diameter,
                shadowRadius: diameter * 0.12,
              },
            ]}
          >
            <View
              style={[
                styles.seaBubbleHighlight,
                {
                  borderRadius: diameter * 0.1,
                  height: diameter * 0.2,
                  left: diameter * 0.2,
                  top: diameter * 0.16,
                  width: diameter * 0.2,
                },
              ]}
            />
          </View>
        );
      })}
    </Animated.View>
  );
}

function SwayingCoral({
  delay,
  height,
  left,
  reducedMotion,
  size,
  top,
  width,
}: {
  delay: number;
  height: number;
  left: number;
  reducedMotion: boolean;
  size: number;
  top: number;
  width: number;
}) {
  const progress = useSharedValue(0);
  const coralSize = width * (size / 360);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.5;
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );

    return () => cancelAnimation(progress);
  }, [delay, progress, reducedMotion]);

  const movementStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(progress.value, [0, 1], [-0.65, 0.65])}deg`,
      },
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-coralSize * 0.008, coralSize * 0.008],
        ),
      },
      {
        scaleX: interpolate(progress.value, [0, 1], [0.995, 1.005]),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.seaCoral,
        {
          height: coralSize,
          left: width * left,
          top: height * top,
          width: coralSize,
        },
        movementStyle,
      ]}
    >
      <Image
        resizeMode="contain"
        source={SEA_AMBIENT_ASSETS.coralFrames[1]}
        style={styles.flyingFrame}
      />
    </Animated.View>
  );
}

function SeaAmbientDecorations({
  height,
  reducedMotion,
  width,
}: {
  height: number;
  reducedMotion: boolean;
  width: number;
}) {
  return (
    <>
      <SwimmingTropicalFish
        height={height}
        reducedMotion={reducedMotion}
        width={width}
      />
      <SwimmingFish
        delay={6800}
        duration={19000}
        height={height}
        reducedMotion={reducedMotion}
        size={70}
        top={0.59}
        width={width}
      />
      <RisingBubbles
        delay={0}
        height={height}
        left={0.04}
        reducedMotion={reducedMotion}
        size={74}
        top={0.46}
        width={width}
      />
      <RisingBubbles
        delay={3100}
        height={height}
        left={0.67}
        reducedMotion={reducedMotion}
        size={64}
        top={0.7}
        width={width}
      />
      <SwayingCoral
        delay={0}
        height={height}
        left={0.57}
        reducedMotion={reducedMotion}
        size={104}
        top={0.79}
        width={width}
      />
      <SwayingCoral
        delay={1300}
        height={height}
        left={0.05}
        reducedMotion={reducedMotion}
        size={82}
        top={0.34}
        width={width}
      />
    </>
  );
}

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
      {environment === 'land' && (
        <LandAmbientDecorations
          height={height}
          reducedMotion={reducedMotion}
          width={width}
        />
      )}
      {environment === 'sea' && (
        <SeaAmbientDecorations
          height={height}
          reducedMotion={reducedMotion}
          width={width}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  decorationImage: {
    height: '100%',
    width: '100%',
  },
  flyingFrame: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  flyingBird: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  flyingButterfly: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  landDecoration: {
    position: 'absolute',
  },
  seaCoral: {
    position: 'absolute',
    transformOrigin: 'bottom center',
  },
  seaBubble: {
    backgroundColor: 'rgba(91, 223, 255, 0.16)',
    borderColor: 'rgba(203, 249, 255, 0.86)',
    position: 'absolute',
    shadowColor: '#61E8FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.62,
  },
  seaBubbleHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    position: 'absolute',
  },
  seaMovingElement: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  tropicalFish: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
  },
});
