import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import {
  CardSkiaReflection,
  type CardReflectionVariant,
} from '@/src/shared/ui/CardSkiaReflection';
import { ReleaseCreatureAlert } from '@/src/shared/ui/ReleaseCreatureAlert';

import type {
  CaptureCardType,
  CaptureDetail,
  CaptureTier,
} from '../model/types';

const CARD_PLACEHOLDER_IMAGE = require('@/src/shared/assets/images/farm/card-image-placeholder.png');
const CARD_BACK_IMAGES: Record<CaptureCardType, ImageSourcePropType> = {
  GROUND: require('@/src/shared/assets/images/farm/card-back-ground.png'),
  SEA: require('@/src/shared/assets/images/farm/card-back-sea.png'),
  SKY: require('@/src/shared/assets/images/farm/kkomi-card-back.png'),
  SPACE: require('@/src/shared/assets/images/farm/card-back-space.png'),
};
const CARD_PACK_FRONT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-pack-front.png');
const CARD_PACK_BACK_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-pack-back.png');
const CARD_PACK_READY_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-pack-ready.png');
const CARD_PACK_OPEN_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-pack-open-text.png');
const CARD_PACK_CUT_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-pack-cut-text.png');
const FINISHING_CARD_GENERATION_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/finishing-card-generation-text.png');
const CARD_GENERATION_SPINNER_IMAGE = require('@/src/shared/assets/images/capture/card-opening/card-generation-spinner.png');
const PROCESSING_ANALYZING_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/processing-analyzing-text.png');
const PROCESSING_SELECTING_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/processing-selecting-text.png');
const CHOOSE_ONE_TEXT_IMAGE = require('@/src/shared/assets/images/capture/card-opening/choose-one-text.png');
const CUT_SCISSORS_IMAGE = require('@/src/shared/assets/images/capture/card-opening/cut-scissors.png');
const SAVE_TO_FARM_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/card-opening/save-to-farm-button.png');
const RETURN_TO_NATURE_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/card-opening/return-to-nature-button.png');
const SCANNER_LOTTIE = require('@/src/shared/assets/images/capture/card-opening/scanner.json');
const PACK_OPEN_GLOW_IMAGE = require('@/src/shared/assets/images/capture/card-opening/glow-static.svg');
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const ANALYZING_DURATION_MS = 8000;
const SELECTING_DURATION_MS = 10500;
const PACK_OPENING_DURATION_MS = 8000;
const CUT_DASH_COUNT = 18;
const CARD_SELECT_FRONT_DELAYS = [
  0, 500, 1000, 1500, 1998.798, 2500, 2998.798, 3497.596,
  3998.798, 4497.596, 4996.394, 5493.988, 5996.394, 6750,
  7500, 8250,
];
const CARD_SELECT_BACK_DELAYS = [
  1300, 1800, 2300, 2798.798, 3298.798, 3800, 4297.596, 4800,
  5300, 5797.596, 6300, 7050, 7800, 8550, 9300,
];
const CARD_SELECT_FINAL_DELAY = 8993.739;
const RESULT_CARD_ROTATION_DEGREES_PER_POINT = 0.9;
const RESULT_CARD_DOUBLE_TAP_DELAY_MS = 300;
const RESULT_CARD_RESET_DURATION_MS = 300;
const CAPTURE_TIER_REFLECTION_VARIANTS: Partial<
  Record<CaptureTier, CardReflectionVariant>
> = {
  A: 'tier-a',
  S: 'tier-s',
  SS: 'tier-ss',
};

function isResultCardFrontFacing(rotationX: number, rotationY: number) {
  const xRadians = (rotationX * Math.PI) / 180;
  const yRadians = (rotationY * Math.PI) / 180;

  return Math.cos(xRadians) * Math.cos(yRadians) >= 0;
}
const SKY_CARD_POSITIONS = [
  { delay: 0, x: -111.06, y: -70 },
  { delay: 1367, x: 0, y: -70 },
  { delay: 2800, x: 111.06, y: -70 },
  { delay: 4133, x: -55.53, y: 73.66 },
  { delay: 5467, x: 55.53, y: 73.66 },
] as const;

type OpeningStage =
  | 'analyzing'
  | 'selecting'
  | 'ready'
  | 'cut'
  | 'opening'
  | 'sky'
  | 'waiting-result'
  | 'result';

type CardOpeningSequenceProps = {
  cardType?: CaptureCardType;
  captureDetail: CaptureDetail | null;
  onReturnToFarm: () => void;
  photoUri: string;
};

export function CardOpeningSequence({
  cardType,
  captureDetail,
  onReturnToFarm,
  photoUri,
}: CardOpeningSequenceProps) {
  const [stage, setStage] = useState<OpeningStage>('analyzing');
  const [cutProgress, setCutProgress] = useState(0);
  const [canSelectCard, setCanSelectCard] = useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState<
    number | null
  >(null);
  const [isReleaseAlertVisible, setIsReleaseAlertVisible] =
    useState(false);
  const cardBackImage = CARD_BACK_IMAGES[cardType ?? 'GROUND'];
  const shimmer = useRef(new Animated.Value(0)).current;
  const packFloat = useRef(new Animated.Value(0)).current;
  const opening = useRef(new Animated.Value(0)).current;
  const skyArrivals = useRef(
    SKY_CARD_POSITIONS.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    shimmer.setValue(0);
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    animation.start();
    return () => animation.stop();
  }, [canSelectCard, shimmer, stage]);

  useEffect(() => {
    if (stage !== 'analyzing') return;

    const timer = setTimeout(
      () => setStage('selecting'),
      ANALYZING_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'selecting') return;

    const timer = setTimeout(
      () => setStage('ready'),
      SELECTING_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'ready') return;

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(packFloat, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(packFloat, {
          toValue: -1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [packFloat, stage]);

  useEffect(() => {
    if (stage !== 'opening') return;

    opening.setValue(0);
    Animated.timing(opening, {
      toValue: 1,
      duration: PACK_OPENING_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setStage('sky');
    });
  }, [opening, stage]);

  useEffect(() => {
    if (stage !== 'sky') return;

    setCanSelectCard(false);
    setHighlightedCardIndex(null);
    skyArrivals.forEach((arrival) => arrival.setValue(0));
    const animations = skyArrivals.map((arrival, index) =>
      Animated.sequence([
        Animated.delay(SKY_CARD_POSITIONS[index].delay),
        Animated.timing(arrival, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.22, 0.61, 0.36, 1),
          useNativeDriver: true,
        }),
      ]),
    );
    animations.forEach((animation) => animation.start());
    const timer = setTimeout(() => setCanSelectCard(true), 7200);
    return () => {
      clearTimeout(timer);
      animations.forEach((animation) => animation.stop());
    };
  }, [skyArrivals, stage]);

  useEffect(() => {
    if (stage === 'waiting-result' && captureDetail) {
      setStage('result');
    }
  }, [captureDetail, stage]);

  const cutPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          const nextProgress = Math.max(
            0,
            Math.min(1, gesture.dx / scaleByDeviceWidth(268.5)),
          );
          setCutProgress(nextProgress);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx >= scaleByDeviceWidth(236.3)) {
            setCutProgress(1);
            setTimeout(() => setStage('opening'), 180);
            return;
          }
          setCutProgress(0);
        },
        onPanResponderTerminate: () => setCutProgress(0),
      }),
    [],
  );

  const title =
    stage === 'analyzing'
      ? 'ANALYZING...'
      : stage === 'selecting'
        ? 'Select...'
        : stage === 'ready'
          ? 'Card Pack Ready'
          : stage === 'cut'
            ? 'Cut Your Card Pack!'
            : stage === 'sky' && canSelectCard
              ? 'Choose One!'
              : '';

  const description =
    stage === 'analyzing'
      ? '사진 속 동물을 분석하고 있어요'
      : stage === 'selecting'
        ? '적합한 카드팩을 선정하고 있어요'
        : stage === 'ready'
          ? '완성된 카드팩을 눌러 열어보세요'
          : stage === 'cut'
            ? '절취선을 끝까지 잘라보세요'
            : stage === 'sky' && canSelectCard
              ? '하나를 선택해 보세요'
              : '';

  const packTranslateY = packFloat.interpolate({
    inputRange: [-1, 1],
    outputRange: [
      scaleByDeviceWidth(20),
      scaleByDeviceWidth(-20),
    ],
  });
  const packRotation = packFloat.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '2deg'],
  });

  if (stage === 'opening') {
    return (
      <View accessibilityLabel="카드팩 개봉 중" style={styles.container}>
        <OpeningAnimation cardBackImage={cardBackImage} progress={opening} />
      </View>
    );
  }

  if (stage === 'waiting-result') {
    return (
      <View accessibilityLabel="카드 결과 생성 중" style={styles.container}>
        <View style={styles.waitingResultContent}>
          <View style={[styles.shimmerTitleMask, styles.readyTitleMask]}>
            <ShimmerTitle
              cut={false}
              progress={shimmer}
              ready
              selecting={false}
              title="Card Pack Ready"
            />
          </View>
          <Image
            accessibilityLabel="카드 생성을 마무리하고 있어요"
            resizeMode="contain"
            source={FINISHING_CARD_GENERATION_TEXT_IMAGE}
            style={styles.finishingCardGenerationText}
          />
          <Animated.Image
            accessibilityLabel="카드 생성 중"
            resizeMode="contain"
            source={CARD_GENERATION_SPINNER_IMAGE}
            style={[
              styles.cardGenerationSpinner,
              {
                transform: [
                  {
                    rotate: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>
    );
  }

  if (stage === 'result') {
    return (
      <View style={styles.container}>
        {isReleaseAlertVisible ? (
          <ReleaseCreatureAlert
            onClose={() => setIsReleaseAlertVisible(false)}
            onConfirm={onReturnToFarm}
          />
        ) : (
          <ResultCard
            cardBackImage={cardBackImage}
            cardImageUrl={captureDetail?.cardImageUrl}
            onRelease={() => setIsReleaseAlertVisible(true)}
            tier={captureDetail?.tier}
            onSave={() =>
              {
                router.push({
                pathname: '/save-to-farm',
                params: {
                  farmType: captureDetail?.cardType ?? 'GROUND',
                  ...(captureDetail
                    ? {
                        captureId: captureDetail.captureId,
                        tier: captureDetail.tier,
                        cardType: captureDetail.cardType,
                        generationStatus: captureDetail.generationStatus,
                        gameStatus: captureDetail.gameStatus,
                        cardImageUrl: captureDetail.cardImageUrl,
                        animalImageUrl: captureDetail.animalImageUrl,
                        elapsedMs: captureDetail.elapsedMs,
                        failureReason: captureDetail.failureReason,
                      }
                  : {}),
                },
                });
              }
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.heading,
          stage === 'analyzing' && styles.analyzingHeading,
          stage === 'selecting' && styles.selectingHeading,
          stage === 'ready' && styles.readyHeading,
          stage === 'cut' && styles.cutHeading,
          stage === 'sky' && styles.skyHeading,
        ]}
      >
        <View
          style={[
            styles.shimmerTitleMask,
            stage === 'analyzing' && styles.analyzingTitleMask,
            stage === 'selecting' && styles.selectingTitleMask,
            stage === 'ready' && styles.readyTitleMask,
            stage === 'cut' && styles.cutTitleMask,
            stage === 'sky' && styles.skyTitleMask,
          ]}
        >
          <ShimmerTitle
            progress={shimmer}
            cut={stage === 'cut'}
            ready={stage === 'ready'}
            selecting={stage === 'selecting'}
            title={title}
          />
        </View>
        {stage === 'analyzing' ? (
          <Image
            resizeMode="contain"
            source={PROCESSING_ANALYZING_TEXT_IMAGE}
            style={styles.analyzingTextImage}
          />
        ) : stage === 'selecting' ? (
          <Image
            resizeMode="contain"
            source={PROCESSING_SELECTING_TEXT_IMAGE}
            style={styles.selectingTextImage}
          />
        ) : stage === 'ready' ? (
          <Image
            resizeMode="contain"
            source={CARD_PACK_OPEN_TEXT_IMAGE}
            style={styles.openTextImage}
          />
        ) : stage === 'cut' ? (
          <Image
            resizeMode="contain"
            source={CARD_PACK_CUT_TEXT_IMAGE}
            style={styles.cutTextImage}
          />
        ) : stage === 'sky' && canSelectCard ? (
          <Image
            resizeMode="contain"
            source={CHOOSE_ONE_TEXT_IMAGE}
            style={styles.chooseTextImage}
          />
        ) : (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      {stage === 'analyzing' && (
        <View style={styles.analyzingScanArea}>
          <View style={styles.photoFrame}>
            <Image
              resizeMode="cover"
              source={{ uri: photoUri }}
              style={styles.photo}
            />
            <View pointerEvents="none" style={styles.photoBorder} />
          </View>
          <LottieView
            autoPlay
            loop
            source={SCANNER_LOTTIE}
            style={styles.scannerLottie}
          />
        </View>
      )}

      {stage === 'selecting' && (
        <View style={styles.selectingArea}>
          {CARD_SELECT_BACK_DELAYS.map((delay) => (
            <SelectingSweepCard
              back
              delay={delay}
              key={`back-${delay}`}
            />
          ))}
          <Image
            resizeMode="cover"
            source={{ uri: photoUri }}
            style={styles.selectingPhoto}
          />
          {CARD_SELECT_FRONT_DELAYS.map((delay) => (
            <SelectingSweepCard
              delay={delay}
              key={`front-${delay}`}
            />
          ))}
          <SelectingSweepCard
            delay={CARD_SELECT_FINAL_DELAY}
            final
          />
        </View>
      )}

      {stage === 'ready' && (
        <Pressable
          accessibilityLabel="카드팩 자르기 시작"
          accessibilityRole="button"
          onPress={() => setStage('cut')}
          style={styles.packButton}
        >
          <Animated.Image
            resizeMode="contain"
            source={CARD_PACK_FRONT_IMAGE}
            style={[
              styles.readyPack,
              {
                transform: [
                  { translateY: packTranslateY },
                  { rotate: packRotation },
                ],
              },
            ]}
          />
        </Pressable>
      )}

      {stage === 'cut' && (
        <View style={styles.cutArea}>
          <Image
            resizeMode="contain"
            source={CARD_PACK_READY_IMAGE}
            style={styles.cutPack}
          />
          <View
            {...cutPanResponder.panHandlers}
            style={styles.cutTrack}
          >
            <View pointerEvents="none" style={styles.cutDashedLine}>
              {Array.from({ length: CUT_DASH_COUNT }, (_, index) => (
                <View key={index} style={styles.cutDash} />
              ))}
            </View>
            <View
              style={[
                styles.cutCompletedLine,
                { width: `${cutProgress * 100}%` },
              ]}
            />
            <View
              style={[
                styles.scissors,
                {
                  left:
                    cutProgress * scaleByDeviceWidth(268.5) -
                    scaleByDeviceWidth(26),
                },
              ]}
            >
              <Image
                resizeMode="contain"
                source={CUT_SCISSORS_IMAGE}
                style={styles.scissorsImage}
              />
            </View>
          </View>
        </View>
      )}

      {stage === 'sky' && (
        <View style={styles.skyArea}>
          {SKY_CARD_POSITIONS.map((position, index) => {
            const arrival = skyArrivals[index];
            return (
            <Pressable
              key={`${position.x}-${position.y}`}
              accessibilityLabel={`${index + 1}번 카드 선택`}
              accessibilityRole="button"
              disabled={!canSelectCard}
              onHoverIn={() => setHighlightedCardIndex(index)}
              onHoverOut={() => setHighlightedCardIndex(null)}
              onPress={() =>
                setStage(captureDetail ? 'result' : 'waiting-result')
              }
              onPressIn={() => setHighlightedCardIndex(index)}
              onPressOut={() => setHighlightedCardIndex(null)}
              style={[
                styles.skyCardHitArea,
                {
                  transform: [
                    { translateX: scaleByDeviceWidth(position.x) },
                    { translateY: scaleByDeviceWidth(position.y) },
                  ],
                },
              ]}
            >
              {({ pressed }) => {
                const isHighlighted =
                  pressed || highlightedCardIndex === index;

                return (
                  <>
                    {isHighlighted && (
                      <View
                        pointerEvents="none"
                        style={styles.skyCardGlow}
                      />
                    )}
                    <Animated.Image
                      resizeMode="contain"
                      source={cardBackImage}
                      style={[
                        styles.skyCard,
                        isHighlighted && styles.skyCardHighlighted,
                        {
                          opacity: arrival,
                          transform: [
                            {
                              translateX: arrival.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                  scaleByDeviceWidth(-position.x),
                                  0,
                                ],
                              }),
                            },
                            {
                              translateY: arrival.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                  scaleByDeviceWidth(-position.y),
                                  0,
                                ],
                              }),
                            },
                            {
                              rotate: arrival.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['120deg', '0deg'],
                              }),
                            },
                            {
                              scale: arrival.interpolate({
                                inputRange: [0, 0.35, 1],
                                outputRange: [0.01, 1.875, 1],
                              }),
                            },
                            {
                              translateY: isHighlighted
                                ? scaleByDeviceWidth(-8)
                                : 0,
                            },
                            { scale: isHighlighted ? 1.1 : 1 },
                          ],
                        },
                      ]}
                    />
                  </>
                );
              }}
            </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ShimmerTitle({
  cut,
  progress,
  ready,
  selecting,
  title,
}: {
  cut: boolean;
  progress: Animated.Value;
  ready: boolean;
  selecting: boolean;
  title: string;
}) {
  return (
    <View style={styles.shimmerTextRow}>
      {Array.from(title).map((character, index, characters) => {
        const peak =
          characters.length <= 1
            ? 0.5
            : 0.15 + (index / (characters.length - 1)) * 0.7;
        const opacity = progress.interpolate({
          inputRange: [0, peak - 0.09, peak, peak + 0.09, 1],
          outputRange: [0.24, 0.24, 1, 0.24, 0.24],
          extrapolate: 'clamp',
        });

        return (
          <Animated.Text
            key={`${character}-${index}`}
            style={[
              styles.shimmerCharacter,
              selecting && styles.selectingShimmerCharacter,
              ready && styles.readyShimmerCharacter,
              cut && styles.cutShimmerCharacter,
              { opacity },
            ]}
          >
            {character}
          </Animated.Text>
        );
      })}
    </View>
  );
}

function SelectingSweepCard({
  back = false,
  delay,
  final = false,
}: {
  back?: boolean;
  delay: number;
  final?: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  const translateX = progress.interpolate({
    inputRange: final ? [0, 0.617, 1] : [0, 0.5, 1],
    outputRange: back
      ? [
          scaleByDeviceWidth(278),
          0,
          scaleByDeviceWidth(-277),
        ]
      : final
        ? [scaleByDeviceWidth(-277), 0, 0]
        : [
            scaleByDeviceWidth(-277),
            0,
            scaleByDeviceWidth(278),
          ],
  });
  const translateY = progress.interpolate({
    inputRange: final ? [0, 0.617, 1] : [0, 0.5, 1],
    outputRange: final
      ? [scaleByDeviceWidth(-27), 0, 0]
      : back
        ? [
            scaleByDeviceWidth(30),
            0,
            scaleByDeviceWidth(30),
          ]
        : [
            scaleByDeviceWidth(-27),
            0,
            scaleByDeviceWidth(-27),
          ],
  });
  const scale = progress.interpolate({
    inputRange: final ? [0, 0.617, 1] : [0, 0.5, 1],
    outputRange: final
      ? [0.6, 1.5, 1.522]
      : back
        ? [0.6, 0.6, 0.6]
        : [0.6, 1.5, 0.6],
  });

  return (
    <Animated.Image
      resizeMode="contain"
      source={back ? CARD_PACK_BACK_IMAGE : CARD_PACK_FRONT_IMAGE}
      style={[
        styles.sweepingCard,
        back && styles.sweepingCardBehind,
        final && styles.sweepingCardFinal,
        {
          opacity: progress.interpolate({
            inputRange: [0, 0.01, 0.99, 1],
            outputRange: final
              ? [0, 1, 1, 1]
              : back
                ? [0, 0.3, 0.3, 0]
                : [0, 1, 1, 0],
          }),
          transform: [
            { translateX },
            { translateY },
            {
              rotate: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['5deg', '0deg', '-5deg'],
              }),
            },
            { scale },
          ],
        },
      ]}
    />
  );
}

function OpeningAnimation({
  cardBackImage,
  progress,
}: {
  cardBackImage: ImageSourcePropType;
  progress: Animated.Value;
}) {
  const glowProgress = useRef(new Animated.Value(0)).current;
  const cardLaunches = [
    {
      node: '6570:779',
      rotationTimes: [0, 1],
      rotations: ['0deg', '0deg'],
      scaleTimes: [0, 2901.569, 3258.211, 8000],
      scalesY: [1, 1, 0.9, 0.9],
      times: [0, 600, 2000, 2575, 3258.211, 8000],
      x: [0.17, 0.17, 0.17, 0, 1.81, 1.81],
      y: [15.5, 15.5, -29.88, 0, -822.77, -822.77],
    },
    {
      node: '6570:778',
      rotationTimes: [0, 2000, 2575, 8000],
      rotations: ['-3.39deg', '-3.39deg', '0.11deg', '0.11deg'],
      scaleTimes: [0, 3829.946, 4161.929, 8000],
      scalesY: [1, 1, 0.9, 0.9],
      times: [0, 600, 2000, 2575, 3033.984, 3535.236, 4161.929, 8000],
      x: [-5.91, -5.91, -3.69, 0, 0, 0, -11.18, -11.18],
      y: [10.47, 10.47, -32, 0, 5, -15.12, -805.35, -805.35],
    },
    {
      node: '6570:777',
      rotationTimes: [0, 1993, 2575, 8000],
      rotations: ['3.39deg', '3.39deg', '-0.11deg', '-0.11deg'],
      scaleTimes: [0, 4861.372, 5191.867, 8000],
      scalesY: [1, 1, 0.9, 0.9],
      times: [0, 600, 2000, 2575, 3535.236, 3986.798, 4495.472, 5191.867, 8000],
      x: [8.12, 8.12, 8.12, 0, 12.03, 2.85, 0, -7.92, -7.92],
      y: [10.48, 10.48, -31, 0, -4, 1.01, -15.11, -795.78, -795.78],
    },
    {
      node: '6570:776',
      rotationTimes: [0, 1],
      rotations: ['-0.11deg', '-0.11deg'],
      scaleTimes: [0, 5852.735, 6211.345, 8000],
      scalesY: [1, 1, 0.9, 0.9],
      times: [0, 5000, 5455.708, 6211.345, 8000],
      x: [0.43, 0.43, 0, -7.92, -7.92],
      y: [16.56, 16.56, 0, -780.66, -780.66],
    },
    {
      node: '6570:775',
      rotationTimes: [0, 1],
      rotations: ['-0.11deg', '-0.11deg'],
      scaleTimes: [0, 6814.151, 7173.826, 8000],
      scalesY: [1, 1, 0.9, 0.9],
      times: [0, 5960.236, 6415.944, 7173.826, 8000],
      x: [0, 0, 0, -7.92, -7.92],
      y: [16.11, 16.11, 0, -780.66, -780.66],
    },
  ];

  useEffect(() => {
    glowProgress.setValue(0);
    const glowAnimation = Animated.timing(glowProgress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    glowAnimation.start();
    return () => glowAnimation.stop();
  }, [glowProgress]);

  return (
    <View style={styles.openingArea}>
      <View pointerEvents="none" style={styles.openingGlow}>
        <AnimatedExpoImage
          contentFit="contain"
          source={PACK_OPEN_GLOW_IMAGE}
          style={[
            styles.openingGlowImage,
            {
              opacity: glowProgress.interpolate({
                inputRange: [0, 0.1, 0.85, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  rotate: glowProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['5deg', '0deg'],
                  }),
                },
                {
                  scale: glowProgress.interpolate({
                    inputRange: [0, 0.4, 0.6, 1],
                    outputRange: [0.2, 1, 1, 0.2],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <View pointerEvents="none" style={styles.launchClip}>
        {cardLaunches.map((cardLaunch, index) => {
          const inputRange = cardLaunch.times.map(
            (time) => time / PACK_OPENING_DURATION_MS,
          );
          const rotationInputRange = cardLaunch.rotationTimes.map(
            (time) => time / PACK_OPENING_DURATION_MS,
          );
          const scaleInputRange = cardLaunch.scaleTimes.map(
            (time) => time / PACK_OPENING_DURATION_MS,
          );

          return (
            <Animated.Image
              key={cardLaunch.node}
              resizeMode="contain"
              source={cardBackImage}
              style={[
                styles.launchCard,
                {
                  zIndex: 10 + index,
                  transform: [
                    {
                      translateX: progress.interpolate({
                        inputRange,
                        outputRange: cardLaunch.x.map(scaleByDeviceWidth),
                      }),
                    },
                    {
                      translateY: progress.interpolate({
                        inputRange,
                        outputRange: cardLaunch.y.map(scaleByDeviceWidth),
                      }),
                    },
                    {
                      rotate: progress.interpolate({
                        inputRange: rotationInputRange,
                        outputRange: cardLaunch.rotations,
                      }),
                    },
                    {
                      scaleY: progress.interpolate({
                        inputRange: scaleInputRange,
                        outputRange: cardLaunch.scalesY,
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.packBody,
          {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 7003 / 8000, 7402.468 / 8000, 1],
                  outputRange: [
                    0,
                    0,
                    scaleByDeviceWidth(387.63),
                    scaleByDeviceWidth(387.63),
                  ],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.packBottomClip}>
          <Image
            resizeMode="stretch"
            source={CARD_PACK_READY_IMAGE}
            style={styles.packBottomImage}
          />
        </View>
        <Animated.View
          style={[
            styles.packTopClip,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.075, 0.125, 0.25, 1],
                outputRange: [1, 1, 1, 0, 0],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.075, 0.125, 0.25, 1],
                    outputRange: [
                      0,
                      0,
                      scaleByDeviceWidth(-7.43),
                      scaleByDeviceWidth(-61.73),
                      scaleByDeviceWidth(-61.73),
                    ],
                  }),
                },
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.075, 0.125, 0.25, 1],
                    outputRange: [
                      0,
                      0,
                      scaleByDeviceWidth(1.31),
                      scaleByDeviceWidth(10.89),
                      scaleByDeviceWidth(10.89),
                    ],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 0.075, 0.125, 0.25, 1],
                    outputRange: [
                      '0deg',
                      '0deg',
                      '10deg',
                      '30deg',
                      '30deg',
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            resizeMode="stretch"
            source={CARD_PACK_READY_IMAGE}
            style={styles.packTopImage}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function ResultCard({
  cardBackImage,
  cardImageUrl,
  onRelease,
  onSave,
  tier,
}: {
  cardBackImage: ImageSourcePropType;
  cardImageUrl?: string;
  onRelease: () => void;
  onSave: () => void;
  tier?: CaptureTier;
}) {
  const [failedCardImageUrl, setFailedCardImageUrl] =
    useState<string | null>(null);
  const hasCardImageFailed =
    cardImageUrl !== undefined && failedCardImageUrl === cardImageUrl;
  const cardReflectionVariant = tier
    ? CAPTURE_TIER_REFLECTION_VARIANTS[tier]
    : undefined;
  const cardRotationX = useRef(new Animated.Value(0)).current;
  const cardRotationY = useRef(new Animated.Value(180)).current;
  const cardFrontOpacity = useRef(new Animated.Value(0)).current;
  const cardBackOpacity = useRef(new Animated.Value(1)).current;
  const cardRotationXStartRef = useRef(0);
  const cardRotationYStartRef = useRef(0);
  const lastCardTapAtRef = useRef(0);
  const isRevealCompleteRef = useRef(false);
  const updateCardFace = (rotationX: number, rotationY: number) => {
    const isFrontFacing = isResultCardFrontFacing(
      rotationX,
      rotationY,
    );
    cardFrontOpacity.setValue(isFrontFacing ? 1 : 0);
    cardBackOpacity.setValue(isFrontFacing ? 0 : 1);
  };
  const finishCardRotation = (dx: number, dy: number) => {
    const nextRotationX =
      cardRotationXStartRef.current -
      dy * RESULT_CARD_ROTATION_DEGREES_PER_POINT;
    const nextRotationY =
      cardRotationYStartRef.current +
      dx * RESULT_CARD_ROTATION_DEGREES_PER_POINT;

    cardRotationX.setValue(nextRotationX);
    cardRotationY.setValue(nextRotationY);
    cardRotationXStartRef.current = nextRotationX;
    cardRotationYStartRef.current = nextRotationY;
    updateCardFace(nextRotationX, nextRotationY);
  };
  const resetCardRotation = () => {
    cardRotationXStartRef.current = 0;
    cardRotationYStartRef.current = 0;

    Animated.parallel([
      Animated.timing(cardRotationX, {
        toValue: 0,
        duration: RESULT_CARD_RESET_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardRotationY, {
        toValue: 0,
        duration: RESULT_CARD_RESET_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => updateCardFace(0, 0));
  };
  const handleCardGestureEnd = (dx: number, dy: number) => {
    const isTap =
      Math.hypot(dx, dy) <= scaleByDeviceWidth(3);

    if (isTap) {
      const now = Date.now();
      if (
        now - lastCardTapAtRef.current <=
        RESULT_CARD_DOUBLE_TAP_DELAY_MS
      ) {
        lastCardTapAtRef.current = 0;
        resetCardRotation();
        return;
      }
      lastCardTapAtRef.current = now;
    } else {
      lastCardTapAtRef.current = 0;
    }

    finishCardRotation(dx, dy);
  };
  const cardPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        isRevealCompleteRef.current,
      onStartShouldSetPanResponderCapture: () =>
        isRevealCompleteRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        isRevealCompleteRef.current &&
        Math.hypot(gestureState.dx, gestureState.dy) >
          scaleByDeviceWidth(3),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        isRevealCompleteRef.current &&
        Math.hypot(gestureState.dx, gestureState.dy) >
          scaleByDeviceWidth(3),
      onPanResponderGrant: () => {
        cardRotationX.stopAnimation((currentRotation) => {
          cardRotationXStartRef.current = currentRotation;
        });
        cardRotationY.stopAnimation((currentRotation) => {
          cardRotationYStartRef.current = currentRotation;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextRotationX =
          cardRotationXStartRef.current -
          gestureState.dy * RESULT_CARD_ROTATION_DEGREES_PER_POINT;
        const nextRotationY =
          cardRotationYStartRef.current +
          gestureState.dx * RESULT_CARD_ROTATION_DEGREES_PER_POINT;

        cardRotationX.setValue(nextRotationX);
        cardRotationY.setValue(nextRotationY);
        updateCardFace(nextRotationX, nextRotationY);
      },
      onPanResponderRelease: (_, gestureState) =>
        handleCardGestureEnd(gestureState.dx, gestureState.dy),
      onPanResponderTerminate: (_, gestureState) =>
        finishCardRotation(gestureState.dx, gestureState.dy),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  useEffect(() => {
    isRevealCompleteRef.current = false;
    cardRotationX.setValue(0);
    cardRotationY.setValue(180);
    cardRotationXStartRef.current = 0;
    cardRotationYStartRef.current = 180;
    cardFrontOpacity.setValue(0);
    cardBackOpacity.setValue(1);

    const faceSwapTimer = setTimeout(() => {
      cardFrontOpacity.setValue(1);
      cardBackOpacity.setValue(0);
    }, 400);

    const revealAnimation = Animated.timing(cardRotationY, {
      toValue: 0,
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    revealAnimation.start(({ finished }) => {
      if (finished) {
        cardRotationYStartRef.current = 0;
        isRevealCompleteRef.current = true;
      }
    });

    return () => {
      clearTimeout(faceSwapTimer);
      revealAnimation.stop();
    };
  }, [
    cardBackOpacity,
    cardFrontOpacity,
    cardRotationX,
    cardRotationY,
  ]);

  const cardRotateX = cardRotationX.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const cardRotateY = cardRotationY.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });
  const cardBackRotateY = cardRotationY.interpolate({
    inputRange: [0, 360],
    outputRange: ['180deg', '540deg'],
    extrapolate: 'extend',
  });
  const resultCardWidth = scaleByDeviceWidth(283.66);
  const resultCardHeight = scaleByDeviceWidth(408.52);

  return (
    <View accessibilityLabel="포착한 캐릭터 카드" style={styles.resultArea}>
      <Animated.View
        {...cardPanResponder.panHandlers}
        accessibilityHint="상하좌우로 밀어서 회전하고 두 번 탭하면 처음 방향으로 돌아갑니다"
        accessibilityLabel="포착한 캐릭터 카드"
        accessible
        style={styles.resultCard}
      >
        <Animated.Image
          defaultSource={CARD_PLACEHOLDER_IMAGE}
          onError={() => {
            if (cardImageUrl) {
              setFailedCardImageUrl(cardImageUrl);
            }
          }}
          resizeMode="contain"
          source={
            cardImageUrl && !hasCardImageFailed
              ? { uri: cardImageUrl }
              : CARD_PLACEHOLDER_IMAGE
          }
          style={[
            styles.resultCardFace,
            {
              backfaceVisibility: 'hidden',
              opacity: cardFrontOpacity,
              transform: [
                { perspective: scaleByDeviceWidth(900) },
                { rotateX: cardRotateX },
                { rotateY: cardRotateY },
              ],
            },
          ]}
        />
        <Animated.Image
          resizeMode="contain"
          source={cardBackImage}
          style={[
            styles.resultCardFace,
            {
              backfaceVisibility: 'hidden',
              opacity: cardBackOpacity,
              transform: [
                { perspective: scaleByDeviceWidth(900) },
                { rotateX: cardRotateX },
                { rotateY: cardBackRotateY },
              ],
            },
          ]}
        />
        {cardReflectionVariant && (
          <CardSkiaReflection
            cardHeight={resultCardHeight}
            cardWidth={resultCardWidth}
            frontOpacity={cardFrontOpacity}
            rotationX={cardRotationX}
            rotationY={cardRotationY}
            style={{
              width: resultCardWidth,
              height: resultCardHeight,
              borderRadius: scaleByDeviceWidth(14),
              transform: [
                { perspective: scaleByDeviceWidth(900) },
                { rotateX: cardRotateX },
                { rotateY: cardRotateY },
              ],
            }}
            variant={cardReflectionVariant}
          />
        )}
      </Animated.View>
      <View style={styles.resultActions}>
        <Pressable
          accessibilityLabel="농장에 저장하기"
          onPress={onSave}
          style={styles.resultActionButton}
        >
          <Image
            resizeMode="contain"
            source={SAVE_TO_FARM_BUTTON_IMAGE}
            style={styles.resultActionButtonImage}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="자연으로 돌려보내기"
          onPress={onRelease}
          style={styles.resultActionButton}
        >
          <Image
            resizeMode="contain"
            source={RETURN_TO_NATURE_BUTTON_IMAGE}
            style={styles.resultActionButtonImage}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 18, 23, 0.94)',
  },
  waitingResultContent: {
    alignItems: 'center',
  },
  finishingCardGenerationText: {
    width: scaleByDeviceWidth(176),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.56),
  },
  cardGenerationSpinner: {
    width: scaleByDeviceWidth(92.49),
    height: scaleByDeviceWidth(92.49),
    marginTop: scaleByDeviceWidth(132.37),
  },
  heading: {
    position: 'absolute',
    top: scaleByDeviceWidth(116),
    alignItems: 'center',
  },
  analyzingHeading: {
    top: scaleByDeviceWidth(171.81),
    width: scaleByDeviceWidth(330),
    height: scaleByDeviceWidth(118),
  },
  selectingHeading: {
    top: scaleByDeviceWidth(171.81),
    width: scaleByDeviceWidth(330),
    height: scaleByDeviceWidth(118),
  },
  readyHeading: {
    top: scaleByDeviceWidth(171.81),
    width: scaleByDeviceWidth(330),
    height: scaleByDeviceWidth(118),
  },
  cutHeading: {
    top: scaleByDeviceWidth(171.81),
    width: scaleByDeviceWidth(330),
    height: scaleByDeviceWidth(118),
  },
  skyHeading: {
    top: scaleByDeviceWidth(171.81),
    width: scaleByDeviceWidth(330),
    height: scaleByDeviceWidth(118),
  },
  shimmerTitleMask: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingTitleMask: {
    width: scaleByDeviceWidth(143),
    height: scaleByDeviceWidth(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectingTitleMask: {
    width: scaleByDeviceWidth(95.44),
    height: scaleByDeviceWidth(16.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitleMask: {
    width: scaleByDeviceWidth(187.24),
    height: scaleByDeviceWidth(28),
    marginBottom: scaleByDeviceWidth(-8.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cutTitleMask: {
    width: scaleByDeviceWidth(231),
    height: scaleByDeviceWidth(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skyTitleMask: {
    width: scaleByDeviceWidth(140),
    height: scaleByDeviceWidth(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerCharacter: {
    color: '#FFFFFF',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(22),
    letterSpacing: scaleByDeviceWidth(1.8),
    textShadowColor: '#9FE1FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scaleByDeviceWidth(9),
  },
  selectingShimmerCharacter: {
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(18),
    letterSpacing: scaleByDeviceWidth(1.8),
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: scaleByDeviceWidth(-1) }],
  },
  readyShimmerCharacter: {
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(24),
    letterSpacing: scaleByDeviceWidth(1.2),
    includeFontPadding: true,
    paddingBottom: scaleByDeviceWidth(4),
    textAlignVertical: 'center',
    transform: [{ translateY: scaleByDeviceWidth(-1) }],
  },
  cutShimmerCharacter: {
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(20),
    lineHeight: scaleByDeviceWidth(22),
    letterSpacing: scaleByDeviceWidth(1.2),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    marginTop: scaleByDeviceWidth(16),
    color: '#F2EBDD',
    fontFamily: 'EliceDXNeolli-Medium',
    fontSize: scaleByDeviceWidth(14),
  },
  analyzingTextImage: {
    width: scaleByDeviceWidth(180),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.57),
  },
  selectingTextImage: {
    width: scaleByDeviceWidth(189),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.57),
  },
  openTextImage: {
    width: scaleByDeviceWidth(201),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.57),
  },
  cutTextImage: {
    width: scaleByDeviceWidth(118),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.57),
  },
  chooseTextImage: {
    width: scaleByDeviceWidth(122),
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(15.57),
  },
  photoFrame: {
    width: scaleByDeviceWidth(206),
    height: scaleByDeviceWidth(206),
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(8),
  },
  analyzingScanArea: {
    position: 'absolute',
    top: scaleByDeviceWidth(297.36),
    width: scaleByDeviceWidth(248),
    height: scaleByDeviceWidth(248),
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: scaleByDeviceWidth(1),
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: scaleByDeviceWidth(8),
  },
  scannerLottie: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    width: scaleByDeviceWidth(248),
    height: scaleByDeviceWidth(248),
  },
  selectingArea: {
    position: 'absolute',
    top: scaleByDeviceWidth(289.81),
    width: '100%',
    height: scaleByDeviceWidth(360),
  },
  selectingPhoto: {
    position: 'absolute',
    top: scaleByDeviceWidth(28.55),
    left: '50%',
    zIndex: 10,
    width: scaleByDeviceWidth(206),
    height: scaleByDeviceWidth(206),
    marginLeft: scaleByDeviceWidth(-103),
    borderRadius: scaleByDeviceWidth(8),
  },
  sweepingCard: {
    position: 'absolute',
    top: scaleByDeviceWidth(102),
    left: '50%',
    zIndex: 20,
    width: scaleByDeviceWidth(117),
    height: scaleByDeviceWidth(165),
    marginLeft: scaleByDeviceWidth(-58.5),
  },
  sweepingCardBehind: {
    top: scaleByDeviceWidth(91),
    zIndex: 0,
    opacity: 0.3,
  },
  sweepingCardFinal: {
    zIndex: 30,
  },
  packButton: {
    position: 'absolute',
    top: scaleByDeviceWidth(345.84),
    left: '50%',
    width: scaleByDeviceWidth(210.06),
    height: scaleByDeviceWidth(282.66),
    marginLeft: scaleByDeviceWidth(-105.03),
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyPack: {
    width: scaleByDeviceWidth(210.06),
    height: scaleByDeviceWidth(282.66),
  },
  cutArea: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(19.26),
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(420.1),
  },
  cutPack: {
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(420.1),
  },
  cutTrack: {
    position: 'absolute',
    top: scaleByDeviceWidth(36.96),
    left: '7%',
    width: '86%',
    height: scaleByDeviceWidth(42),
    justifyContent: 'center',
  },
  cutDashedLine: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cutDash: {
    width: scaleByDeviceWidth(9),
    height: scaleByDeviceWidth(2),
    backgroundColor: '#FFFFFF',
  },
  cutCompletedLine: {
    position: 'absolute',
    left: 0,
    height: scaleByDeviceWidth(4),
    backgroundColor: '#9FE1FF',
  },
  scissors: {
    position: 'absolute',
    top: scaleByDeviceWidth(-2),
  },
  scissorsImage: {
    width: scaleByDeviceWidth(41),
    height: scaleByDeviceWidth(36),
  },
  skyArea: {
    width: '100%',
    height: scaleByDeviceWidth(520),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skyCardHitArea: {
    position: 'absolute',
    width: scaleByDeviceWidth(104),
    height: scaleByDeviceWidth(147),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skyCard: {
    width: scaleByDeviceWidth(92),
    height: scaleByDeviceWidth(130),
  },
  skyCardGlow: {
    position: 'absolute',
    width: scaleByDeviceWidth(88),
    height: scaleByDeviceWidth(124),
    borderRadius: scaleByDeviceWidth(12),
    backgroundColor: 'rgba(255, 220, 80, 0.42)',
    borderWidth: scaleByDeviceWidth(3),
    borderColor: 'rgba(255, 244, 174, 0.9)',
    shadowColor: '#FFDC50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scaleByDeviceWidth(24),
    elevation: scaleByDeviceWidth(18),
    transform: [
      { translateY: scaleByDeviceWidth(-8) },
      { scale: 1.16 },
    ],
  },
  skyCardHighlighted: {
    shadowColor: '#FFF0A3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scaleByDeviceWidth(16),
    elevation: scaleByDeviceWidth(20),
  },
  openingArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  openingGlow: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(131.13),
    left: '50%',
    zIndex: 30,
    width: scaleByDeviceWidth(382),
    height: scaleByDeviceWidth(392),
    marginLeft: scaleByDeviceWidth(-167),
  },
  openingGlowImage: {
    width: '100%',
    height: '100%',
  },
  launchClip: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  launchCard: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(57.36),
    left: '50%',
    width: scaleByDeviceWidth(210),
    height: scaleByDeviceWidth(297),
    marginLeft: scaleByDeviceWidth(-105),
  },
  packBody: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(19.26),
    left: '50%',
    zIndex: 20,
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(420.1),
    marginLeft: scaleByDeviceWidth(-156.105),
  },
  packBottomClip: {
    position: 'absolute',
    top: scaleByDeviceWidth(57.96),
    left: 0,
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(362.14),
    overflow: 'hidden',
  },
  packBottomImage: {
    position: 'absolute',
    top: scaleByDeviceWidth(-57.96),
    left: 0,
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(420.1),
  },
  packTopClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(57.96),
    overflow: 'hidden',
    transformOrigin: '92.9% 95.4%',
  },
  packTopImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scaleByDeviceWidth(312.21),
    height: scaleByDeviceWidth(420.1),
  },
  resultArea: {
    position: 'absolute',
    top: scaleByDeviceWidth(133.19),
    alignItems: 'center',
  },
  resultCard: {
    width: scaleByDeviceWidth(283.66),
    height: scaleByDeviceWidth(408.52),
  },
  resultCardFace: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  resultActions: {
    gap: scaleByDeviceWidth(12.34),
    marginTop: scaleByDeviceWidth(41.7),
  },
  resultActionButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  resultActionButtonImage: {
    width: '100%',
    height: '100%',
  },
});
