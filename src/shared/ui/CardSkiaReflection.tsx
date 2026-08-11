import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type CardSkiaReflectionProps = {
  cardHeight: number;
  cardWidth: number;
  frontOpacity: Animated.Value;
  rotationX: Animated.Value;
  rotationY: Animated.Value;
  style: Animated.WithAnimatedValue<ViewStyle>;
  variant: CardReflectionVariant;
};

type ReanimatedCardSkiaReflectionProps = {
  cardHeight: number;
  cardWidth: number;
  rotationX: SharedValue<number>;
  rotationY: SharedValue<number>;
  variant: CardReflectionVariant;
};

export type CardReflectionVariant = 'tier-a' | 'tier-s' | 'tier-ss';

type CardReflectionGradientConfig = {
  colors: string[];
  endYRatio: number;
  positions: number[];
  startYRatio: number;
};

type CardReflectionVariantConfig = {
  angleScaleMax?: number;
  canvasScale: number;
  colors: string[];
  gradientEndYRatio: number;
  gradientPositions: number[];
  gradientStartYRatio: number;
  maxOpacity: number;
  translateXRatio: number;
  translateYRatio: number;
  underlayGradients?: CardReflectionGradientConfig[];
};

const SS_REFLECTION_LINE_CENTERS = [0.32, 0.41, 0.5, 0.59, 0.68];
const SS_REFLECTION_LINE_COLORS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,1)',
  'rgba(255,255,255,0)',
];
const SS_REFLECTION_LINE_HALF_WIDTH = 0.015;

function buildSsReflectionLineGradient() {
  const colors: string[] = [];
  const positions: number[] = [];
  const stopCount = SS_REFLECTION_LINE_COLORS.length - 1;

  for (const center of SS_REFLECTION_LINE_CENTERS) {
    SS_REFLECTION_LINE_COLORS.forEach((color, index) => {
      colors.push(color);
      positions.push(
        Number(
          (
            center -
            SS_REFLECTION_LINE_HALF_WIDTH +
            (SS_REFLECTION_LINE_HALF_WIDTH * 2 * index) / stopCount
          ).toFixed(4),
        ),
      );
    });
  }

  return { colors, positions };
}

const SS_REFLECTION_LINE_GRADIENT = buildSsReflectionLineGradient();

const CARD_REFLECTION_VARIANTS: Record<
  CardReflectionVariant,
  CardReflectionVariantConfig
> = {
  'tier-s': {
    canvasScale: 2.2,
    colors: [
      'rgba(255,255,255,0)',
      'rgba(255,135,220,0.55)',
      'rgba(255,238,155,0.8)',
      'rgba(255,255,255,1)',
      'rgba(125,235,255,0.85)',
      'rgba(185,145,255,0.6)',
      'rgba(255,255,255,0)',
    ],
    gradientEndYRatio: 0.82,
    gradientPositions: [0.28, 0.38, 0.46, 0.5, 0.54, 0.62, 0.72],
    gradientStartYRatio: 0.18,
    maxOpacity: 0.96,
    translateXRatio: 0.55,
    translateYRatio: 0.45,
  },
  'tier-a': {
    canvasScale: 2.2,
    colors: [
      'rgba(255,255,255,0)',
      'rgba(255,248,205,1)',
      'rgba(190,240,255,1)',
      'rgba(255,255,255,0)',
    ],
    gradientEndYRatio: 0.63,
    gradientPositions: [0.4, 0.45, 0.5, 0.54],
    gradientStartYRatio: 0.37,
    maxOpacity: 0.86,
    translateXRatio: 0.55,
    translateYRatio: 0.45,
  },
  'tier-ss': {
    angleScaleMax: 1.3,
    canvasScale: 2.4,
    colors: SS_REFLECTION_LINE_GRADIENT.colors,
    gradientEndYRatio: 0.9,
    gradientPositions: SS_REFLECTION_LINE_GRADIENT.positions,
    gradientStartYRatio: 0.1,
    maxOpacity: 0.96,
    translateXRatio: 0.6,
    translateYRatio: 0.5,
    underlayGradients: [
      {
        colors: [
          'rgba(255,255,255,0)',
          'rgba(255,248,220,0.35)',
          'rgba(255,255,255,0.9)',
          'rgba(175,225,255,0.55)',
          'rgba(255,255,255,0)',
        ],
        endYRatio: 0.82,
        positions: [0.18, 0.34, 0.5, 0.66, 0.82],
        startYRatio: 0.18,
      },
    ],
  },
};

function normalizeRotation(rotation: number) {
  'worklet';

  return ((rotation + 180) % 360 + 360) % 360;
}

function getReflectionIntensity(rotation: number) {
  'worklet';

  return interpolate(
    normalizeRotation(rotation),
    [0, 90, 180, 270, 360],
    [0.03, 0.34, 0.03, 0.34, 0.03],
  );
}

function isCardFrontFacing(rotationX: number, rotationY: number) {
  'worklet';

  const xRadians = (rotationX * Math.PI) / 180;
  const yRadians = (rotationY * Math.PI) / 180;

  return Math.cos(xRadians) * Math.cos(yRadians) >= 0;
}

type CardReflectionCanvasProps = {
  canvasScale?: number;
  cardHeight: number;
  cardWidth: number;
  fillsEntireCard?: boolean;
  gradientEndYRatio?: number;
  gradientPositions?: number[];
  gradientStartYRatio?: number;
  reflectionColors?: string[];
  underlayGradients?: CardReflectionGradientConfig[];
};

function CardReflectionCanvas({
  canvasScale = 1.5,
  cardHeight,
  cardWidth,
  fillsEntireCard = false,
  gradientEndYRatio = 0.63,
  gradientPositions = [0.4, 0.45, 0.5, 0.54],
  gradientStartYRatio = 0.37,
  reflectionColors,
  underlayGradients = [],
}: CardReflectionCanvasProps) {
  const reflectionWidth = cardWidth * canvasScale;
  const reflectionHeight = cardHeight * canvasScale;
  const reflectionX = fillsEntireCard ? 0 : cardWidth * (0.25 + 0.068);
  const reflectionY = fillsEntireCard ? 0 : cardHeight * (0.25 + 0.047);
  const reflectionAreaWidth = fillsEntireCard
    ? reflectionWidth
    : cardWidth * 0.865;
  const reflectionAreaHeight = fillsEntireCard
    ? reflectionHeight
    : cardHeight * 0.68;
  const reflectionBorderRadius = fillsEntireCard
    ? cardWidth * (12 / 226.92)
    : cardWidth * 0.025;
  const gradientColors = reflectionColors ?? [
    'rgba(255,255,255,0)',
    'rgba(255,225,130,0.9)',
    'rgba(100,200,255,0.9)',
    'rgba(255,255,255,0)',
  ];
  const gradients: CardReflectionGradientConfig[] = [
    ...underlayGradients,
    {
      colors: gradientColors,
      endYRatio: gradientEndYRatio,
      positions: gradientPositions,
      startYRatio: gradientStartYRatio,
    },
  ];

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {gradients.map((gradient, index) => (
        <RoundedRect
          key={`${index}-${gradient.positions.join('-')}`}
          x={reflectionX}
          y={reflectionY}
          width={reflectionAreaWidth}
          height={reflectionAreaHeight}
          r={reflectionBorderRadius}
        >
          <LinearGradient
            colors={gradient.colors}
            end={vec(
              reflectionWidth,
              reflectionHeight * gradient.endYRatio,
            )}
            positions={gradient.positions}
            start={vec(0, reflectionHeight * gradient.startYRatio)}
          />
        </RoundedRect>
      ))}
    </Canvas>
  );
}

export function CardSkiaReflection({
  cardHeight,
  cardWidth,
  frontOpacity,
  rotationX,
  rotationY,
  style,
  variant,
}: CardSkiaReflectionProps) {
  const {
    angleScaleMax = 1,
    canvasScale,
    colors,
    gradientEndYRatio,
    gradientPositions,
    gradientStartYRatio,
    maxOpacity,
    translateXRatio,
    translateYRatio,
    underlayGradients,
  } = CARD_REFLECTION_VARIANTS[variant];
  const reflectionCanvasOffset = (canvasScale - 1) / 2;
  const reflectionWidth = cardWidth * canvasScale;
  const reflectionHeight = cardHeight * canvasScale;
  const normalizedReflectionX = Animated.modulo(
    Animated.add(rotationX, 180),
    360,
  );
  const normalizedReflectionY = Animated.modulo(
    Animated.add(rotationY, 180),
    360,
  );
  const translateX = normalizedReflectionY.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [
      0,
      -cardWidth * translateXRatio,
      0,
      cardWidth * translateXRatio,
      0,
    ],
  });
  const translateY = normalizedReflectionX.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [
      0,
      cardHeight * translateYRatio,
      0,
      -cardHeight * translateYRatio,
      0,
    ],
  });
  const intensityX = normalizedReflectionX.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [0.03, 0.34, 0.03, 0.34, 0.03],
  });
  const intensityY = normalizedReflectionY.interpolate({
    inputRange: [0, 90, 180, 270, 360],
    outputRange: [0.03, 0.34, 0.03, 0.34, 0.03],
  });
  const combinedIntensity = Animated.add(intensityX, intensityY);
  const opacity = Animated.multiply(
    frontOpacity,
    combinedIntensity.interpolate({
      inputRange: [0.06, 0.68],
      outputRange: [0, maxOpacity],
    }),
  );
  const angleScale = combinedIntensity.interpolate({
    inputRange: [0.06, 0.68],
    outputRange: [1, angleScaleMax],
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.clip, style]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: -cardHeight * reflectionCanvasOffset,
          left: -cardWidth * reflectionCanvasOffset,
          width: reflectionWidth,
          height: reflectionHeight,
          opacity,
          transform: [{ translateX }, { translateY }, { scale: angleScale }],
        }}
      >
        <CardReflectionCanvas
          canvasScale={canvasScale}
          cardHeight={cardHeight}
          cardWidth={cardWidth}
          fillsEntireCard
          gradientEndYRatio={gradientEndYRatio}
          gradientPositions={gradientPositions}
          gradientStartYRatio={gradientStartYRatio}
          reflectionColors={colors}
          underlayGradients={underlayGradients}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function ReanimatedCardSkiaReflection({
  cardHeight,
  cardWidth,
  rotationX,
  rotationY,
  variant,
}: ReanimatedCardSkiaReflectionProps) {
  const {
    angleScaleMax = 1,
    canvasScale: reflectionCanvasScale,
    colors,
    gradientEndYRatio,
    gradientPositions,
    gradientStartYRatio,
    maxOpacity,
    translateXRatio,
    translateYRatio,
    underlayGradients,
  } = CARD_REFLECTION_VARIANTS[variant];
  const reflectionCanvasOffset = (reflectionCanvasScale - 1) / 2;
  const reflectionWidth = cardWidth * reflectionCanvasScale;
  const reflectionHeight = cardHeight * reflectionCanvasScale;
  const perspective = cardWidth * (800 / 226.92);
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective },
      { rotateX: `${rotationX.value}deg` },
      { rotateY: `${rotationY.value}deg` },
    ],
  }));
  const reflectionAnimatedStyle = useAnimatedStyle(() => {
    const normalizedX = normalizeRotation(rotationX.value);
    const normalizedY = normalizeRotation(rotationY.value);
    const rotationTilt = Math.min(
      1,
      Math.max(
        Math.abs(Math.sin((rotationX.value * Math.PI) / 180)),
        Math.abs(Math.sin((rotationY.value * Math.PI) / 180)),
      ),
    );
    const angleScale = interpolate(
      rotationTilt,
      [0, 1],
      [1, angleScaleMax],
    );
    const combinedIntensity =
      getReflectionIntensity(rotationX.value) +
      getReflectionIntensity(rotationY.value);
    const opacity = interpolate(
      combinedIntensity,
      [0.06, 0.68],
      [0, maxOpacity],
    );

    return {
      opacity: isCardFrontFacing(rotationX.value, rotationY.value)
        ? opacity
        : 0,
      transform: [
        {
          translateX: interpolate(
            normalizedY,
            [0, 90, 180, 270, 360],
            [
              0,
              -cardWidth * translateXRatio,
              0,
              cardWidth * translateXRatio,
              0,
            ],
          ),
        },
        {
          translateY: interpolate(
            normalizedX,
            [0, 90, 180, 270, 360],
            [
              0,
              cardHeight * translateYRatio,
              0,
              -cardHeight * translateYRatio,
              0,
            ],
          ),
        },
        { scale: angleScale },
      ],
    };
  });

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.clip,
        {
          width: cardWidth,
          height: cardHeight,
          borderRadius: cardWidth * (12 / 226.92),
        },
        containerAnimatedStyle,
      ]}
    >
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: -cardHeight * reflectionCanvasOffset,
            left: -cardWidth * reflectionCanvasOffset,
            width: reflectionWidth,
            height: reflectionHeight,
          },
          reflectionAnimatedStyle,
        ]}
      >
        <CardReflectionCanvas
          canvasScale={reflectionCanvasScale}
          cardHeight={cardHeight}
          cardWidth={cardWidth}
          fillsEntireCard
          gradientEndYRatio={gradientEndYRatio}
          gradientPositions={gradientPositions}
          gradientStartYRatio={gradientStartYRatio}
          reflectionColors={colors}
          underlayGradients={underlayGradients}
        />
      </Reanimated.View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
});
