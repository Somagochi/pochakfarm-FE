import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { scaleByDeviceWidth } from '@/src/shared/lib/layout';
import { ErrorModal } from '@/src/shared/ui/ErrorModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardOpeningSequence } from './CardOpeningSequence';
import type {
  CaptureCardType,
  CaptureDetail,
  CaptureGameResult,
  CaptureTier,
  CaptureThrowResult,
} from '../model/types';

const CAPTURE_SECONDS = 10;
const FRAME_WIDTH = scaleByDeviceWidth(44.26);
const FRAME_HEIGHT = scaleByDeviceWidth(66.02);
const GUIDE_HEIGHT = scaleByDeviceWidth(28);
const FRAME_GUIDE_GAP = scaleByDeviceWidth(15.16);
const TARGET_SIZE = scaleByDeviceWidth(270);
const TARGET_RING_SIZE = scaleByDeviceWidth(230);
const SUCCESS_DISTANCE = TARGET_RING_SIZE / 2;
const SUCCESS_SCALE = 0.38;
const TARGET_MIN_SCALE = 0;
const DEFAULT_RING_SHRINK_DURATION_MS = 1800;
const TARGET_RESPAWN_DELAY = 120;
const MIN_THROW_DISTANCE = scaleByDeviceWidth(24);
const MIN_THROW_VELOCITY = 0.18;
const IDEAL_THROW_DISTANCE = scaleByDeviceWidth(100);
const IDEAL_THROW_VELOCITY = 1;
const MIN_THROW_POWER = 0.35;
const MAX_THROW_POWER = 1.65;
const MAX_THROWS = 3;
const CAMERA_CARD_ASPECT_RATIO = 1312 / 2080;
const THROW_FRAME_IMAGE = require('@/src/shared/assets/images/capture/throw-card.png');
const THROW_CARD_LABEL_IMAGE = require('@/src/shared/assets/images/capture/throw-card-label.png');
const THROW_GUIDE_IMAGE = require('@/src/shared/assets/images/capture/throw-guide.png');
const TIMER_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/timer-background.png');
const TIMER_CLOCK_IMAGE = require('@/src/shared/assets/images/capture/timer-clock.png');
const TIMER_PROGRESS_IMAGE = require('@/src/shared/assets/images/capture/timer-progress-segmented.png');
const OPPORTUNITY_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-background.png');
const OPPORTUNITY_LABEL_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-label.png');
const OPPORTUNITY_USED_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-used.png');
const OPPORTUNITY_AVAILABLE_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-available.png');
const CAMERA_FRAME_IMAGE = require('@/src/shared/assets/images/capture/captured-camera-frame.png');
const POLAROID_EXIT_IMAGE = require('@/src/shared/assets/images/capture/polaroid-exit.png');
const TARGET_FRAME_IMAGE = require('@/src/shared/assets/images/capture/pochak-circle.png');
const TARGET_CONTRACTING_RING_IMAGE = require('@/src/shared/assets/images/capture/pochak-contracting-circle.png');
const CAPTURE_RESULT_CARD_IMAGE = require('@/src/shared/assets/images/capture/capture-result-card.png');
const CAPTURE_SUCCESS_OPEN_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/capture-success-open-button.png');
const CAPTURE_RETRY_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/capture-retry-button.png');
const CAPTURE_SUCCESS_LOTTIE = require('@/src/shared/assets/images/capture/pochak-success.json');
const CAPTURE_FAILURE_LOTTIE = require('@/src/shared/assets/images/capture/pochak-fail.json');
const CAPTURE_TIER_IMAGES = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
} as const;
const POLAROID_EXIT_WIDTH = scaleByDeviceWidth(360);
const POLAROID_EXIT_HEIGHT = scaleByDeviceWidth(20.96);
const POLAROID_EXIT_TOP_OFFSET = scaleByDeviceWidth(3);
const EXPERIENCE_BAR_WIDTH = scaleByDeviceWidth(280);
const EXPERIENCE_ANIMATION_DURATION_MS = 1400;

type CaptureResult = 'success' | 'failure' | null;
type FailureReason = 'timeout' | 'attempts' | null;

async function triggerFailedThrowHaptics() {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error,
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error,
    );
  } catch {
    // 햅틱을 지원하지 않는 환경에서도 게임 진행은 계속합니다.
  }
}

type CaptureGameProps = {
  animalImageKey: string | null;
  apiErrorMessage: string | null;
  cardType?: CaptureCardType;
  captureDetail: CaptureDetail | null;
  gameResult: CaptureGameResult | null;
  photoUri: string;
  onCloseApiError: () => void;
  onClose: () => void;
  onGameResult: (throws: CaptureThrowResult[]) => void;
  onRetry: () => void;
  ringShrinkDurationMs?: number;
  tier?: CaptureTier;
};

export function CaptureGame({
  animalImageKey,
  apiErrorMessage,
  cardType,
  captureDetail,
  gameResult,
  photoUri,
  onCloseApiError,
  onClose,
  onGameResult,
  onRetry,
  ringShrinkDurationMs = DEFAULT_RING_SHRINK_DURATION_MS,
  tier,
}: CaptureGameProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(CAPTURE_SECONDS);
  const [result, setResult] = useState<CaptureResult>(null);
  const [, setFailureReason] = useState<FailureReason>(null);
  const [throwsUsed, setThrowsUsed] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [isTargetPaused, setIsTargetPaused] = useState(false);
  const [isTimingMiss, setIsTimingMiss] = useState(false);
  const [showResultActions, setShowResultActions] = useState(false);
  const [showExperienceAction, setShowExperienceAction] = useState(false);
  const [hasOpenedSuccess, setHasOpenedSuccess] = useState(false);
  const throwPosition = useRef(new Animated.ValueXY()).current;
  const throwRotation = useRef(new Animated.Value(0)).current;
  const throwScale = useRef(new Animated.Value(1)).current;
  const throwArc = useRef(new Animated.Value(0)).current;
  const throwOpacity = useRef(new Animated.Value(1)).current;
  const resultCardShake = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseScaleValue = useRef(1);
  const resultRef = useRef<CaptureResult>(null);
  const experienceProgress = useRef(new Animated.Value(0)).current;
  const resolvedRingShrinkDurationMs =
    ringShrinkDurationMs > 0
      ? ringShrinkDurationMs
      : DEFAULT_RING_SHRINK_DURATION_MS;

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onRetry();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onRetry]);

  const targetCenter = useMemo(
    () => ({
      x: width / 2,
      y: height * 0.5,
    }),
    [height, width],
  );
  const frameLayoutBottom =
    height - insets.bottom - scaleByDeviceWidth(125);
  const cameraCardTop = insets.top + scaleByDeviceWidth(74.94);
  const cameraCardWidth = Math.min(
    width - scaleByDeviceWidth(30),
    (frameLayoutBottom - cameraCardTop - scaleByDeviceWidth(20)) *
      CAMERA_CARD_ASPECT_RATIO,
  );
  const cameraCardHeight = cameraCardWidth / CAMERA_CARD_ASPECT_RATIO;
  const guideTop =
    cameraCardTop + cameraCardHeight + scaleByDeviceWidth(15.62);
  const frameOrigin = useMemo(
    () => ({
      x: width / 2 - FRAME_WIDTH / 2,
      y: guideTop + GUIDE_HEIGHT + FRAME_GUIDE_GAP,
    }),
    [guideTop, width],
  );

  const finishGame = useCallback(
    (
      nextResult: Exclude<CaptureResult, null>,
      throwCount: number,
      nextFailureReason: FailureReason = null,
    ) => {
      if (resultRef.current) {
        return;
      }

      resultRef.current = nextResult;
      onGameResult(
        Array.from({ length: throwCount }, (_, index) => ({
          round: index + 1,
          succeeded:
            nextResult === 'success' && index === throwCount - 1,
        })),
      );
      setFailureReason(nextFailureReason);
      setResult(nextResult);
    },
    [onGameResult],
  );

  useEffect(() => {
    if (result || isThrowing) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          const nextThrowsUsed = throwsUsed + 1;

          setThrowsUsed(nextThrowsUsed);
          void triggerFailedThrowHaptics();

          if (nextThrowsUsed >= MAX_THROWS) {
            finishGame('failure', nextThrowsUsed, 'timeout');
            return 0;
          }

          return CAPTURE_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finishGame, isThrowing, result, throwsUsed]);

  useEffect(() => {
    if (result || isTargetPaused) {
      return;
    }

    const listenerId = pulseScale.addListener(({ value }) => {
      pulseScaleValue.current = value;
    });
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: TARGET_MIN_SCALE,
          duration: resolvedRingShrinkDurationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.delay(TARGET_RESPAWN_DELAY),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      pulseScale.removeListener(listenerId);
    };
  }, [
    isTargetPaused,
    pulseScale,
    resolvedRingShrinkDurationMs,
    result,
  ]);

  useEffect(() => {
    if (!result) {
      return;
    }

    setShowResultActions(false);
    setShowExperienceAction(false);
    experienceProgress.setValue(0);
  }, [experienceProgress, result]);

  useEffect(() => {
    if (!showResultActions || !gameResult) {
      return;
    }

    const { before, after } = gameResult.progression;
    const beforeProgress = before?.requiredExperienceForNextLevel
      ? Math.min(1, before.experience / before.requiredExperienceForNextLevel)
      : 0;
    const afterProgress = after.requiredExperienceForNextLevel
      ? Math.min(1, after.experience / after.requiredExperienceForNextLevel)
      : 1;

    experienceProgress.setValue(beforeProgress);
    const animation = Animated.timing(experienceProgress, {
      toValue: afterProgress,
      duration: EXPERIENCE_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setShowExperienceAction(true);
      }
    });

    return () => animation.stop();
  }, [experienceProgress, gameResult, showResultActions]);

  const resetFrame = useCallback(() => {
    Animated.parallel([
      Animated.spring(throwPosition, {
        toValue: { x: 0, y: 0 },
        speed: 18,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(throwRotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(throwScale, {
        toValue: 1,
        speed: 18,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(throwArc, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(throwOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setIsThrowing(false));
  }, [
    throwArc,
    throwOpacity,
    throwPosition,
    throwRotation,
    throwScale,
  ]);

  const respawnFrame = useCallback(() => {
    Animated.timing(throwOpacity, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      throwPosition.setValue({ x: 0, y: 0 });
      throwRotation.setValue(0);
      throwArc.setValue(0);
      throwScale.setValue(1);
      pulseScale.setValue(1);
      pulseScaleValue.current = 1;

      Animated.timing(throwOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }).start(({ finished: didAppear }) => {
        if (!didAppear) {
          return;
        }

        setIsTargetPaused(false);
        setIsThrowing(false);
      });
    });
  }, [
    pulseScale,
    throwArc,
    throwOpacity,
    throwPosition,
    throwRotation,
    throwScale,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          !isThrowing && !resultRef.current,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !isThrowing &&
          !resultRef.current &&
          (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3),
        onPanResponderMove: (_, gestureState) => {
          throwPosition.setValue({
            x: Math.max(-14, Math.min(14, gestureState.dx * 0.12)),
            y: Math.max(-16, Math.min(8, gestureState.dy * 0.1)),
          });
        },
        onPanResponderRelease: (_, gestureState) => {
          const isUpwardFlick =
            gestureState.dy <= -MIN_THROW_DISTANCE &&
            gestureState.vy <= -MIN_THROW_VELOCITY;

          if (!isUpwardFlick) {
            resetFrame();
            return;
          }

          setIsThrowing(true);
          const nextThrowsUsed = throwsUsed + 1;

          const upwardSpeed = Math.abs(gestureState.vy);
          const upwardDistance = Math.abs(gestureState.dy);
          const horizontalOffset = Math.max(
            -width * 0.42,
            Math.min(
              width * 0.42,
              gestureState.dx * 1.35 +
                gestureState.vx * scaleByDeviceWidth(80),
            ),
          );
          const idealVerticalTravel =
            frameOrigin.y + FRAME_HEIGHT / 2 - targetCenter.y;
          const distancePower = upwardDistance / IDEAL_THROW_DISTANCE;
          const velocityPower = upwardSpeed / IDEAL_THROW_VELOCITY;
          const throwPower = Math.max(
            MIN_THROW_POWER,
            Math.min(
              MAX_THROW_POWER,
              distancePower * 0.65 + velocityPower * 0.35,
            ),
          );
          const destinationY = -idealVerticalTravel * throwPower;
          const landingCenterY =
            frameOrigin.y + FRAME_HEIGHT / 2 + destinationY;
          const flightDuration = Math.max(
            320,
            Math.min(720, 760 - throwPower * 240),
          );

          Animated.parallel([
            Animated.timing(throwPosition, {
              toValue: {
                x: horizontalOffset,
                y: destinationY,
              },
              duration: flightDuration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(throwRotation, {
              toValue: gestureState.vx < 0 ? -1 : 1,
              duration: flightDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(throwScale, {
              toValue: 0.72,
              duration: flightDuration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(throwArc, {
                toValue: scaleByDeviceWidth(-42),
                duration: flightDuration * 0.48,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(throwArc, {
                toValue: 0,
                duration: flightDuration * 0.52,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]).start(({ finished }) => {
            if (!finished || resultRef.current) {
              return;
            }

            pulseScale.stopAnimation();
            setIsTargetPaused(true);

            const landingDistanceFromTarget = Math.hypot(
              horizontalOffset,
              landingCenterY - targetCenter.y,
            );
            const isPositionMatched =
              landingDistanceFromTarget <= SUCCESS_DISTANCE;
            const isTimingMatched =
              pulseScaleValue.current <= SUCCESS_SCALE;

            if (isPositionMatched && isTimingMatched) {
              finishGame('success', nextThrowsUsed);
              return;
            }

            if (!isPositionMatched) {
              void triggerFailedThrowHaptics();
              setThrowsUsed(nextThrowsUsed);

              if (nextThrowsUsed >= MAX_THROWS) {
                finishGame('failure', nextThrowsUsed, 'attempts');
                return;
              }

              setSecondsLeft(CAPTURE_SECONDS);
              respawnFrame();
              return;
            }

            throwOpacity.setValue(0);
            resultCardShake.setValue(0);
            setIsTimingMiss(true);

            requestAnimationFrame(() => {
              const timingMissShakeAnimation = Animated.sequence([
                ...Array.from({ length: 10 }, () => [
                  Animated.timing(resultCardShake, {
                    toValue: -1,
                    duration: 90,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                  }),
                  Animated.timing(resultCardShake, {
                    toValue: 1,
                    duration: 90,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                  }),
                ]).flat(),
                Animated.timing(resultCardShake, {
                  toValue: 0,
                  duration: 200,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
              ]);

              timingMissShakeAnimation.start(
                ({ finished: shakeFinished }) => {
                  if (!shakeFinished) {
                    return;
                  }

                  setThrowsUsed(nextThrowsUsed);

                  if (nextThrowsUsed >= MAX_THROWS) {
                    finishGame('failure', nextThrowsUsed, 'attempts');
                    setIsTimingMiss(false);
                    return;
                  }

                  throwPosition.setValue({ x: 0, y: 0 });
                  throwRotation.setValue(0);
                  throwArc.setValue(0);
                  throwScale.setValue(1);
                  pulseScale.setValue(1);
                  pulseScaleValue.current = 1;
                  setSecondsLeft(CAPTURE_SECONDS);

                  Animated.timing(throwOpacity, {
                    toValue: 1,
                    duration: 140,
                    useNativeDriver: true,
                  }).start(({ finished: didAppear }) => {
                    if (!didAppear) {
                      return;
                    }

                    setIsTimingMiss(false);
                    setIsTargetPaused(false);
                    setIsThrowing(false);
                  });
                },
              );
            });
          });
        },
        onPanResponderTerminate: resetFrame,
      }),
    [
      frameOrigin.y,
      finishGame,
      isThrowing,
      resetFrame,
      respawnFrame,
      pulseScale,
      resultCardShake,
      targetCenter.y,
      throwPosition,
      throwArc,
      throwOpacity,
      throwRotation,
      throwScale,
      throwsUsed,
      width,
    ],
  );

  const frameRotation = throwRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const resultCardRotation = resultCardShake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const resultCardTranslateX = resultCardShake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [
      scaleByDeviceWidth(-8),
      0,
      scaleByDeviceWidth(8),
    ],
  });
  const targetRingColor = pulseScale.interpolate({
    inputRange: [0, 0.333, 0.334, 0.666, 0.667, 1],
    outputRange: [
      '#628D38',
      '#628D38',
      '#E28112',
      '#E28112',
      '#D93920',
      '#D93920',
    ],
  });
  const targetRingTextureScale = Animated.multiply(pulseScale, 0.95);
  const progressionBefore = gameResult?.progression.before;
  const progressionAfter = gameResult?.progression.after;
  const earnedExperience = progressionAfter
    ? progressionBefore
      ? progressionBefore.level === progressionAfter.level
        ? Math.max(0, progressionAfter.experience - progressionBefore.experience)
        : Math.max(
            0,
            progressionBefore.requiredExperienceForNextLevel -
              progressionBefore.experience +
              progressionAfter.experience,
          )
      : Math.max(0, progressionAfter.experience)
    : 0;
  const animatedExperienceWidth = experienceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, EXPERIENCE_BAR_WIDTH],
  });

  return (
    <View style={styles.container}>
      {!(result === 'success' && hasOpenedSuccess) && (
        <Image
          accessibilityLabel="폴라로이드 사진 출구 안쪽"
          resizeMode="stretch"
          source={POLAROID_EXIT_IMAGE}
          style={[
            styles.polaroidExitBack,
            {
              top:
                cameraCardTop -
                POLAROID_EXIT_HEIGHT / 2 +
                POLAROID_EXIT_TOP_OFFSET,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.gameStatusRow,
          { top: insets.top + scaleByDeviceWidth(18) },
        ]}
      >
        <View style={styles.timerCard}>
          <Image
            resizeMode="stretch"
            source={TIMER_BACKGROUND_IMAGE}
            style={styles.timerBackground}
          />
          <View style={styles.timerRow}>
            <Image
              resizeMode="contain"
              source={TIMER_CLOCK_IMAGE}
              style={styles.timerClock}
            />
            <Text style={styles.timerText}>{secondsLeft}초</Text>
          </View>
          <View style={styles.timerTrack}>
            <Image
              resizeMode="contain"
              source={TIMER_PROGRESS_IMAGE}
              style={styles.timerProgressImage}
            />
            <View style={styles.timerElapsedArea}>
              <View
                style={[
                  styles.timerElapsedOverlay,
                  {
                    width: `${((CAPTURE_SECONDS - secondsLeft) / CAPTURE_SECONDS) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
        <View
          accessibilityLabel={`남은 기회 ${MAX_THROWS - throwsUsed}개`}
          style={styles.opportunityCard}
        >
          <Image
            resizeMode="stretch"
            source={OPPORTUNITY_BACKGROUND_IMAGE}
            style={styles.opportunityBackground}
          />
          <Image
            resizeMode="contain"
            source={OPPORTUNITY_LABEL_IMAGE}
            style={styles.opportunityLabel}
          />
          <View style={styles.opportunityFrames}>
            {Array.from({ length: MAX_THROWS }, (_, index) => (
              <Image
                key={index}
                resizeMode="contain"
                source={
                  index < throwsUsed
                    ? OPPORTUNITY_USED_IMAGE
                    : OPPORTUNITY_AVAILABLE_IMAGE
                }
                style={styles.opportunityFrame}
              />
            ))}
          </View>
        </View>
      </View>

      <Image
        accessibilityLabel="타이밍에 맞춰 액자를 던지세요"
        resizeMode="contain"
        source={THROW_GUIDE_IMAGE}
        style={[
          styles.guideImage,
          {
            top: guideTop,
          },
        ]}
      />

      <View
        style={[
          styles.cameraCard,
          {
            top: cameraCardTop,
            width: cameraCardWidth,
            height: cameraCardHeight,
          },
        ]}
      >
        <View style={styles.cameraViewport}>
            <Image
              resizeMode="cover"
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.dimOverlay} />
            {tier && (
              <Image
                accessibilityLabel={`${tier} 티어`}
                resizeMode="contain"
                source={CAPTURE_TIER_IMAGES[tier]}
                style={styles.captureTier}
              />
            )}
        </View>
        <Image
          resizeMode="stretch"
          source={CAMERA_FRAME_IMAGE}
          style={styles.cameraFrame}
        />
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.target,
          {
            left: targetCenter.x - TARGET_SIZE / 2,
            top: targetCenter.y - TARGET_SIZE / 2,
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={TARGET_FRAME_IMAGE}
          style={styles.targetFrameImage}
        />
        <Animated.View
          style={[
            styles.targetContractingRingTexture,
            {
              transform: [{ scale: targetRingTextureScale }],
            },
          ]}
        >
          <Animated.Image
            resizeMode="contain"
            source={TARGET_CONTRACTING_RING_IMAGE}
            style={[
              styles.targetRingTextureImage,
              { tintColor: targetRingColor },
            ]}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.throwingFrame,
          {
            left: frameOrigin.x,
            opacity: throwOpacity,
            top: frameOrigin.y,
            transform: [
              ...throwPosition.getTranslateTransform(),
              { translateY: throwArc },
              { rotate: frameRotation },
              { scale: throwScale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View
          accessibilityLabel="위로 튕겨 던지는 포착 액자"
          accessibilityRole="button"
          style={styles.frameButton}
        >
          <Image
            resizeMode="contain"
            source={THROW_FRAME_IMAGE}
            style={styles.throwFrameImage}
          />
        </View>
      </Animated.View>

      <Image
        accessibilityLabel="카드 던지기"
        resizeMode="contain"
        source={THROW_CARD_LABEL_IMAGE}
        style={[
          styles.throwLabel,
          {
            top:
              frameOrigin.y +
              FRAME_HEIGHT +
              scaleByDeviceWidth(6.99),
          },
        ]}
      />

      {result === 'success' && hasOpenedSuccess && (
        <CardOpeningSequence
          animalImageKey={animalImageKey}
          cardType={cardType}
          captureDetail={captureDetail}
          onReturnToFarm={onClose}
          photoUri={photoUri}
        />
      )}

      {isTimingMiss && !result && (
        <View pointerEvents="none" style={styles.resultOverlay}>
          <Animated.Image
            accessibilityLabel="타이밍을 놓친 포착 결과 카드"
            resizeMode="contain"
            source={CAPTURE_RESULT_CARD_IMAGE}
            style={[
              styles.resultShakeCard,
              {
                transform: [
                  { translateX: resultCardTranslateX },
                  { rotate: resultCardRotation },
                ],
              },
            ]}
          />
        </View>
      )}

      {result && !(result === 'success' && hasOpenedSuccess) && (
        <View accessibilityViewIsModal style={styles.resultOverlay}>
          {!showResultActions && (
            <LottieView
              autoPlay
              loop={false}
              onAnimationFinish={(isCancelled) => {
                if (!isCancelled) {
                  setShowResultActions(true);
                }
              }}
              resizeMode="contain"
              source={
                result === 'success'
                  ? CAPTURE_SUCCESS_LOTTIE
                  : CAPTURE_FAILURE_LOTTIE
              }
              style={styles.resultLottie}
            />
          )}

          {showResultActions && gameResult && progressionAfter && (
            <View style={styles.experienceModal}>
              <View
                accessibilityLabel={`레벨 ${progressionAfter.level}`}
                style={styles.levelBadge}
              >
                <Text style={styles.levelLabel}>Lv</Text>
                <Text style={styles.levelValue}>{progressionAfter.level}</Text>
                <Text style={styles.levelPaw}>♣</Text>
              </View>

              <Text style={styles.experienceTitle}>EXP를 획득했어요</Text>
              <Text style={styles.experienceAmount}>
                +{earnedExperience.toLocaleString('ko-KR')} EXP
              </Text>

              <View style={styles.experienceTrack}>
                <Animated.View
                  style={[
                    styles.experienceFill,
                    { width: animatedExperienceWidth },
                  ]}
                />
              </View>

              <View style={styles.experienceActionSlot}>
                {showExperienceAction && (
                  <Pressable
                    accessibilityLabel={
                      result === 'success'
                        ? '카드 오픈하기'
                        : '다시 도전하기'
                    }
                    accessibilityRole="button"
                    onPress={
                      result === 'success'
                        ? () => setHasOpenedSuccess(true)
                        : onRetry
                    }
                    style={({ pressed }) => [
                      styles.experienceActionButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      resizeMode="contain"
                      source={
                        result === 'success'
                          ? CAPTURE_SUCCESS_OPEN_BUTTON_IMAGE
                          : CAPTURE_RETRY_BUTTON_IMAGE
                      }
                      style={styles.resultButtonImage}
                    />
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      <ErrorModal
        message={apiErrorMessage}
        onClose={onCloseApiError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#F8F2E7',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 29, 24, 0.05)',
  },
  gameStatusRow: {
    position: 'absolute',
    right: scaleByDeviceWidth(15),
    left: scaleByDeviceWidth(15),
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: scaleByDeviceWidth(5.27),
  },
  timerCard: {
    width: scaleByDeviceWidth(191),
    height: scaleByDeviceWidth(40),
    paddingHorizontal: scaleByDeviceWidth(12),
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: scaleByDeviceWidth(7),
  },
  timerBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(191),
    height: scaleByDeviceWidth(40),
  },
  timerRow: {
    width: scaleByDeviceWidth(57),
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: scaleByDeviceWidth(4),
  },
  timerClock: {
    width: scaleByDeviceWidth(18),
    height: scaleByDeviceWidth(18),
  },
  timerText: {
    color: '#32322D',
    fontFamily: 'monospace',
    fontSize: scaleByDeviceWidth(18),
    fontWeight: '900',
  },
  timerTrack: {
    width: scaleByDeviceWidth(103),
    height: scaleByDeviceWidth(16.5),
    position: 'relative',
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(8.25),
  },
  timerProgressImage: {
    position: 'absolute',
    width: scaleByDeviceWidth(103),
    height: scaleByDeviceWidth(16.5),
  },
  timerElapsedArea: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    right: scaleByDeviceWidth(3.5),
    bottom: scaleByDeviceWidth(3.75),
    left: scaleByDeviceWidth(3.5),
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(4.5),
  },
  timerElapsedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF4D2',
  },
  opportunityCard: {
    width: scaleByDeviceWidth(140.71),
    height: scaleByDeviceWidth(40),
    paddingLeft: scaleByDeviceWidth(12.1),
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: scaleByDeviceWidth(3.95),
  },
  opportunityBackground: {
    position: 'absolute',
    width: scaleByDeviceWidth(140.71),
    height: scaleByDeviceWidth(40),
  },
  opportunityLabel: {
    width: scaleByDeviceWidth(43.37),
    height: scaleByDeviceWidth(14),
  },
  opportunityFrames: {
    flexDirection: 'row',
    columnGap: scaleByDeviceWidth(1.48),
  },
  opportunityFrame: {
    width: scaleByDeviceWidth(21.35),
    height: scaleByDeviceWidth(21.35),
  },
  guideImage: {
    position: 'absolute',
    zIndex: 2,
    width: scaleByDeviceWidth(267),
    height: scaleByDeviceWidth(28),
    alignSelf: 'center',
  },
  cameraCard: {
    position: 'absolute',
    alignSelf: 'center',
  },
  cameraFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  polaroidExitBack: {
    position: 'absolute',
    width: POLAROID_EXIT_WIDTH,
    height: POLAROID_EXIT_HEIGHT,
    alignSelf: 'center',
  },
  cameraViewport: {
    position: 'absolute',
    top: '5%',
    right: '7.7%',
    bottom: '8.1%',
    left: '8.1%',
    overflow: 'hidden',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#242224',
  },
  captureTier: {
    position: 'absolute',
    top: scaleByDeviceWidth(10),
    right: scaleByDeviceWidth(6),
    zIndex: 2,
    width: scaleByDeviceWidth(56),
    height: scaleByDeviceWidth(56 * (94 / 67)),
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrameImage: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  targetContractingRingTexture: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  targetRingTextureImage: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  throwingFrame: {
    position: 'absolute',
    zIndex: 4,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  frameButton: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  throwFrameImage: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  throwLabel: {
    position: 'absolute',
    alignSelf: 'center',
    width: scaleByDeviceWidth(53),
    height: scaleByDeviceWidth(14),
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 20, 16, 0.66)',
  },
  resultShakeCard: {
    position: 'absolute',
    top: '30%',
    width: scaleByDeviceWidth(190),
    height: scaleByDeviceWidth(190),
  },
  resultLottie: {
    ...StyleSheet.absoluteFillObject,
  },
  experienceModal: {
    width: scaleByDeviceWidth(340),
    minHeight: scaleByDeviceWidth(398),
    paddingTop: scaleByDeviceWidth(42),
    paddingHorizontal: scaleByDeviceWidth(24),
    paddingBottom: scaleByDeviceWidth(24),
    alignItems: 'center',
    borderWidth: scaleByDeviceWidth(3),
    borderColor: '#8D7652',
    borderRadius: scaleByDeviceWidth(8),
    backgroundColor: '#FFFCF6',
    shadowColor: '#2B2116',
    shadowOffset: {
      width: 0,
      height: scaleByDeviceWidth(4),
    },
    shadowOpacity: 0.35,
    shadowRadius: scaleByDeviceWidth(3),
    elevation: 8,
  },
  levelBadge: {
    width: scaleByDeviceWidth(82),
    height: scaleByDeviceWidth(94),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scaleByDeviceWidth(4),
    borderColor: '#F5D36D',
    borderRadius: scaleByDeviceWidth(18),
    backgroundColor: '#9C8260',
  },
  levelLabel: {
    color: '#E9DDCC',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(18),
    lineHeight: scaleByDeviceWidth(21),
  },
  levelValue: {
    color: '#FFFFFF',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(31),
    lineHeight: scaleByDeviceWidth(35),
    textShadowColor: 'rgba(68, 50, 30, 0.45)',
    textShadowOffset: {
      width: scaleByDeviceWidth(1),
      height: scaleByDeviceWidth(2),
    },
    textShadowRadius: scaleByDeviceWidth(1),
  },
  levelPaw: {
    color: '#F8D76D',
    fontSize: scaleByDeviceWidth(14),
    lineHeight: scaleByDeviceWidth(16),
  },
  experienceTitle: {
    marginTop: scaleByDeviceWidth(18),
    color: '#735D43',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(17),
    lineHeight: scaleByDeviceWidth(23),
  },
  experienceAmount: {
    marginTop: scaleByDeviceWidth(4),
    color: '#F9C23E',
    fontFamily: 'Galmuri11-Bold',
    fontSize: scaleByDeviceWidth(30),
    lineHeight: scaleByDeviceWidth(38),
  },
  experienceTrack: {
    width: EXPERIENCE_BAR_WIDTH,
    height: scaleByDeviceWidth(18),
    marginTop: scaleByDeviceWidth(20),
    overflow: 'hidden',
    borderWidth: scaleByDeviceWidth(1),
    borderColor: '#D7C3A2',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#EEE7DC',
  },
  experienceFill: {
    height: '100%',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#F4C23F',
  },
  experienceActionSlot: {
    height: scaleByDeviceWidth(70),
    marginTop: scaleByDeviceWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceActionButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
  },
  resultButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
