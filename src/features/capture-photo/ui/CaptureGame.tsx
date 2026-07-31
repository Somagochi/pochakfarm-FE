import * as Haptics from 'expo-haptics';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardOpeningSequence } from './CardOpeningSequence';

const CAPTURE_SECONDS = 10;
const FRAME_SIZE = scaleByDeviceWidth(80);
const TARGET_SIZE = scaleByDeviceWidth(270);
const SUCCESS_DISTANCE = scaleByDeviceWidth(72);
const SUCCESS_SCALE = 0.38;
const TARGET_MIN_SCALE = 0.22;
const TARGET_CONTRACT_DURATION = 1800;
const TARGET_RESPAWN_DELAY = 120;
const TARGET_RING_SIZE = scaleByDeviceWidth(230);
const MIN_THROW_DISTANCE = scaleByDeviceWidth(24);
const MIN_THROW_VELOCITY = 0.18;
const MAX_THROWS = 3;
const CAMERA_CARD_ASPECT_RATIO = 414 / 635;
const THROW_FRAME_IMAGE = require('@/src/shared/assets/images/capture/throw-frame.png');
const THROW_GUIDE_IMAGE = require('@/src/shared/assets/images/capture/throw-guide.png');
const TIMER_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/timer-background.png');
const TIMER_CLOCK_IMAGE = require('@/src/shared/assets/images/capture/timer-clock.png');
const TIMER_PROGRESS_IMAGE = require('@/src/shared/assets/images/capture/timer-progress-segmented.png');
const OPPORTUNITY_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-background.png');
const OPPORTUNITY_LABEL_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-label.png');
const OPPORTUNITY_USED_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-used.png');
const OPPORTUNITY_AVAILABLE_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-available.png');
const CAMERA_BRAND_IMAGE = require('@/src/shared/assets/images/capture/camera-brand.png');
const TARGET_FRAME_IMAGE = require('@/src/shared/assets/images/capture/pochak-circle.png');
const CAPTURE_RESULT_CARD_IMAGE = require('@/src/shared/assets/images/capture/capture-result-card.png');
const CAPTURE_SUCCESS_OPEN_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/capture-success-open-button.png');
const CAPTURE_FAILURE_CONFIRM_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/capture-failure-confirm-button.png');
const CAPTURE_TIER_IMAGES = {
  A: require('@/src/shared/assets/images/capture/capture-tier-a.png'),
  B: require('@/src/shared/assets/images/capture/capture-tier-b.png'),
  C: require('@/src/shared/assets/images/capture/capture-tier-c.png'),
  S: require('@/src/shared/assets/images/capture/capture-tier-s.png'),
  SS: require('@/src/shared/assets/images/capture/capture-tier-ss.png'),
  SSS: require('@/src/shared/assets/images/capture/capture-tier-sss.png'),
} as const;
const CURRENT_CAPTURE_TIER: keyof typeof CAPTURE_TIER_IMAGES = 'B';

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
  photoUri: string;
  onClose: () => void;
  onRetry: () => void;
};

export function CaptureGame({
  photoUri,
  onClose,
  onRetry,
}: CaptureGameProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [secondsLeft, setSecondsLeft] = useState(CAPTURE_SECONDS);
  const [result, setResult] = useState<CaptureResult>(null);
  const [, setFailureReason] = useState<FailureReason>(null);
  const [throwsUsed, setThrowsUsed] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [showResultActions, setShowResultActions] = useState(false);
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
  const frameOrigin = useMemo(
    () => ({
      x: width / 2 - FRAME_SIZE / 2,
      y: height - insets.bottom - scaleByDeviceWidth(125),
    }),
    [height, insets.bottom, width],
  );
  const cameraCardTop = insets.top + scaleByDeviceWidth(128);
  const cameraCardWidth = Math.min(
    width - scaleByDeviceWidth(30),
    (frameOrigin.y - cameraCardTop - scaleByDeviceWidth(20)) *
      CAMERA_CARD_ASPECT_RATIO,
  );

  const finishGame = (
    nextResult: Exclude<CaptureResult, null>,
    nextFailureReason: FailureReason = null,
  ) => {
    if (resultRef.current) {
      return;
    }

    resultRef.current = nextResult;
    setFailureReason(nextFailureReason);
    setResult(nextResult);
  };

  useEffect(() => {
    if (result) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          finishGame('failure', 'timeout');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result]);

  useEffect(() => {
    if (result) {
      return;
    }

    const listenerId = pulseScale.addListener(({ value }) => {
      pulseScaleValue.current = value;
    });
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: TARGET_MIN_SCALE,
          duration: TARGET_CONTRACT_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(TARGET_RESPAWN_DELAY),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      pulseScale.removeListener(listenerId);
    };
  }, [pulseScale, result]);

  useEffect(() => {
    if (!result) {
      return;
    }

    setShowResultActions(false);
    resultCardShake.setValue(0);

    const shakeAnimation = Animated.sequence([
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

    shakeAnimation.start(({ finished }) => {
      if (finished) {
        setShowResultActions(true);
      }
    });

    return () => shakeAnimation.stop();
  }, [result, resultCardShake]);

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
      throwOpacity.setValue(1);
      setIsThrowing(false);
    });
  }, [
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
          setThrowsUsed(nextThrowsUsed);

          const upwardSpeed = Math.abs(gestureState.vy);
          const horizontalOffset = Math.max(
            -width * 0.42,
            Math.min(
              width * 0.42,
              gestureState.dx * 1.35 + gestureState.vx * 80,
            ),
          );
          const destinationY =
            targetCenter.y - (frameOrigin.y + FRAME_SIZE / 2);
          const flightDuration = Math.max(
            320,
            Math.min(650, 680 - upwardSpeed * 180),
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

            const isPositionMatched =
              Math.abs(horizontalOffset) <= SUCCESS_DISTANCE;
            const isTimingMatched =
              pulseScaleValue.current <= SUCCESS_SCALE;

            if (isPositionMatched && isTimingMatched) {
              finishGame('success');
              return;
            }

            void triggerFailedThrowHaptics();

            if (nextThrowsUsed >= MAX_THROWS) {
              finishGame('failure', 'attempts');
              return;
            }

            respawnFrame();
          });
        },
        onPanResponderTerminate: resetFrame,
      }),
    [
      frameOrigin.y,
      isThrowing,
      resetFrame,
      respawnFrame,
      targetCenter.y,
      throwPosition,
      throwArc,
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
  const targetRingOpacity = pulseScale.interpolate({
    inputRange: [TARGET_MIN_SCALE, TARGET_MIN_SCALE + 0.08, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
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
          { top: insets.top + scaleByDeviceWidth(83) },
        ]}
      />

      <View
        style={[
          styles.cameraCard,
          { top: cameraCardTop, width: cameraCardWidth },
        ]}
      >
        <View style={styles.cameraBezel}>
          <View style={styles.cameraViewport}>
            <Image
              resizeMode="cover"
              source={{ uri: photoUri }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.dimOverlay} />
            <Image
              accessibilityLabel={`${CURRENT_CAPTURE_TIER} 티어`}
              resizeMode="contain"
              source={CAPTURE_TIER_IMAGES[CURRENT_CAPTURE_TIER]}
              style={styles.captureTier}
            />
          </View>
          <Image
            resizeMode="contain"
            source={CAMERA_BRAND_IMAGE}
            style={styles.cameraBrand}
          />
        </View>
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
            styles.targetContractingRing,
            {
              opacity: targetRingOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
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

      <Text
        pointerEvents="none"
        style={[
          styles.throwLabel,
          {
            top: frameOrigin.y + FRAME_SIZE + 10,
          },
        ]}
      >
        액자 던지기
      </Text>

      {result === 'success' && hasOpenedSuccess && (
        <CardOpeningSequence photoUri={photoUri} />
      )}

      {result && !(result === 'success' && hasOpenedSuccess) && (
        <View accessibilityViewIsModal style={styles.resultOverlay}>
          <Animated.Image
            accessibilityLabel="포착 결과 카드"
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

          {showResultActions && (
            <View style={styles.resultContent}>
              <Text style={styles.resultTitle}>
                {result === 'success' ? '포착 성공' : '포착 실패'}
              </Text>
              <Pressable
                accessibilityLabel={
                  result === 'success' ? '카드 오픈하기' : '확인하기'
                }
                accessibilityRole="button"
                onPress={
                  result === 'success'
                    ? () => setHasOpenedSuccess(true)
                    : onRetry
                }
                style={({ pressed }) => [
                  styles.resultImageButton,
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  resizeMode="contain"
                  source={
                    result === 'success'
                      ? CAPTURE_SUCCESS_OPEN_BUTTON_IMAGE
                      : CAPTURE_FAILURE_CONFIRM_BUTTON_IMAGE
                  }
                  style={styles.resultButtonImage}
                />
              </Pressable>
            </View>
          )}
        </View>
      )}
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
    aspectRatio: CAMERA_CARD_ASPECT_RATIO,
    padding: scaleByDeviceWidth(20),
    borderWidth: scaleByDeviceWidth(3),
    borderColor: '#D5C6AF',
    borderRadius: scaleByDeviceWidth(28),
    backgroundColor: '#FFFDF7',
  },
  cameraBezel: {
    flex: 1,
    padding: scaleByDeviceWidth(8),
    paddingBottom: scaleByDeviceWidth(38),
    borderWidth: scaleByDeviceWidth(4),
    borderColor: '#302D2E',
    borderRadius: scaleByDeviceWidth(14),
    backgroundColor: '#4A4648',
  },
  cameraViewport: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: scaleByDeviceWidth(3),
    borderColor: '#252324',
    borderRadius: scaleByDeviceWidth(9),
    backgroundColor: '#242224',
  },
  captureTier: {
    position: 'absolute',
    top: scaleByDeviceWidth(4),
    right: 0,
    zIndex: 2,
    width: scaleByDeviceWidth(56),
    height: scaleByDeviceWidth(56 * (94 / 67)),
  },
  cameraBrand: {
    position: 'absolute',
    bottom: scaleByDeviceWidth(6),
    left: '50%',
    width: scaleByDeviceWidth(142),
    height: scaleByDeviceWidth(15.55),
    marginLeft: scaleByDeviceWidth(-71),
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
  targetContractingRing: {
    position: 'absolute',
    width: TARGET_RING_SIZE,
    height: TARGET_RING_SIZE,
    borderWidth: scaleByDeviceWidth(1.5),
    borderColor: 'rgba(255, 249, 218, 0.9)',
    borderRadius: TARGET_RING_SIZE / 2,
    shadowColor: '#FFF4C2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: scaleByDeviceWidth(5),
  },
  throwingFrame: {
    position: 'absolute',
    zIndex: 4,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  frameButton: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  throwFrameImage: {
    width: scaleByDeviceWidth(80),
    height: scaleByDeviceWidth(80),
  },
  throwLabel: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#987A50',
    fontSize: scaleByDeviceWidth(14),
    fontWeight: '700',
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
  resultContent: {
    position: 'absolute',
    top: '55%',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scaleByDeviceWidth(24),
  },
  resultTitle: {
    color: '#FFF8E9',
    fontFamily: 'EliceDXNeolli-Bold',
    fontSize: scaleByDeviceWidth(28),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: {
      width: 0,
      height: scaleByDeviceWidth(2),
    },
    textShadowRadius: scaleByDeviceWidth(3),
  },
  resultImageButton: {
    width: scaleByDeviceWidth(280),
    height: scaleByDeviceWidth(60),
    marginTop: scaleByDeviceWidth(18),
  },
  resultButtonImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.65,
  },
});
