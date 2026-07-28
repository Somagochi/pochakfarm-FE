import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRemovePhotoBackground } from '../model/useRemovePhotoBackground';

const CAPTURE_SECONDS = 10;
const FRAME_SIZE = 80;
const TARGET_SIZE = 310;
const SUCCESS_DISTANCE = 72;
const SUCCESS_SCALE = 0.38;
const MIN_THROW_DISTANCE = 24;
const MIN_THROW_VELOCITY = 0.18;
const MAX_THROWS = 3;
const CAMERA_CARD_ASPECT_RATIO = 414 / 635;
const USE_PHOTO_PROMPT_IMAGE = require('@/src/shared/assets/images/capture/use-photo-prompt.png');
const RETAKE_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/retake-button.png');
const USE_PHOTO_BUTTON_IMAGE = require('@/src/shared/assets/images/capture/use-photo-button.png');
const THROW_FRAME_IMAGE = require('@/src/shared/assets/images/capture/throw-frame.png');
const THROW_GUIDE_IMAGE = require('@/src/shared/assets/images/capture/throw-guide.png');
const TIMER_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/timer-background.png');
const TIMER_CLOCK_IMAGE = require('@/src/shared/assets/images/capture/timer-clock.png');
const OPPORTUNITY_BACKGROUND_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-background.png');
const OPPORTUNITY_LABEL_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-label.png');
const OPPORTUNITY_USED_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-used.png');
const OPPORTUNITY_AVAILABLE_IMAGE = require('@/src/shared/assets/images/capture/throw-opportunity-available.png');

type CaptureResult = 'success' | 'failure' | null;
type FailureReason = 'timeout' | 'attempts' | null;

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
  const [failureReason, setFailureReason] = useState<FailureReason>(null);
  const [throwsUsed, setThrowsUsed] = useState(0);
  const [isThrowing, setIsThrowing] = useState(false);
  const [isFrameVisible, setIsFrameVisible] = useState(true);
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const throwPosition = useRef(new Animated.ValueXY()).current;
  const throwRotation = useRef(new Animated.Value(0)).current;
  const throwScale = useRef(new Animated.Value(1)).current;
  const throwArc = useRef(new Animated.Value(0)).current;
  const throwOpacity = useRef(new Animated.Value(1)).current;
  const successEffectProgress = useRef(new Animated.Value(0)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(340)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseScaleValue = useRef(1);
  const resultRef = useRef<CaptureResult>(null);
  const {
    errorMessage: segmentationError,
    removeBackground,
    resultUri: segmentedPhotoUri,
    state: segmentationState,
  } = useRemovePhotoBackground();

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
      y: height - insets.bottom - 125,
    }),
    [height, insets.bottom, width],
  );
  const cameraCardTop = insets.top + 128;
  const cameraCardWidth = Math.min(
    width - 30,
    (frameOrigin.y - cameraCardTop - 20) *
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
          toValue: 0.18,
          duration: 1150,
          useNativeDriver: false,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1150,
          useNativeDriver: false,
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
    if (result !== 'success') {
      return;
    }

    void removeBackground(photoUri);
  }, [photoUri, removeBackground, result]);

  useEffect(() => {
    if (result !== 'success') {
      return;
    }

    setShowSuccessEffect(true);
    successEffectProgress.setValue(0);

    Animated.sequence([
      Animated.timing(successEffectProgress, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.delay(300),
      Animated.timing(successEffectProgress, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessEffect(false);
      setShowSuccessModal(true);
    });
  }, [result, successEffectProgress]);

  useEffect(() => {
    if (!showSuccessModal) {
      return;
    }

    Animated.spring(bottomSheetTranslateY, {
      toValue: 0,
      speed: 16,
      bounciness: 3,
      useNativeDriver: true,
    }).start();
  }, [bottomSheetTranslateY, showSuccessModal]);

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
    }).start(() => {
      setIsFrameVisible(false);

      Animated.parallel([
        Animated.timing(throwPosition, {
          toValue: { x: 0, y: 0 },
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(throwRotation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(throwArc, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(throwScale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(throwOpacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsFrameVisible(true);
        setIsThrowing(false);
      });
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
                toValue: -42,
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

  return (
    <View style={styles.container}>
      <View style={[styles.gameStatusRow, { top: insets.top + 18 }]}>
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
            <View
              style={[
                styles.timerProgress,
                { width: `${(secondsLeft / CAPTURE_SECONDS) * 100}%` },
              ]}
            />
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
        style={[styles.guideImage, { top: insets.top + 83 }]}
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
          </View>
          <Text pointerEvents="none" style={styles.cameraBrand}>
            POCHAKFARM
          </Text>
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
        <View style={[styles.targetRing, styles.targetRingOuter]} />
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
        <View style={styles.targetPoint}>
          <Ionicons color="#FFF7D7" name="paw" size={32} />
        </View>
      </View>

      {isFrameVisible && (
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
      )}

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

      {result === 'success' && (
        <View
          accessibilityViewIsModal
          style={styles.successOnlyScreen}
        >
          {segmentedPhotoUri ? (
            <View style={styles.segmentedPreview}>
              <View style={styles.previewCircle} />
              <Image
                accessibilityLabel="배경이 제거된 동물 사진"
                resizeMode="contain"
                source={{ uri: segmentedPhotoUri }}
                style={styles.segmentedPhoto}
              />
              <Text style={styles.segmentedTitle}>동물 포착 완료!</Text>
              <Text style={styles.segmentedDescription}>
                배경을 깔끔하게 분리했어요
              </Text>
            </View>
          ) : (
            <>
              <Image
                resizeMode="cover"
                source={{ uri: photoUri }}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={styles.successPhotoDim} />
            </>
          )}

          {showSuccessEffect && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.successEffect,
                {
                  opacity: successEffectProgress,
                  transform: [
                    {
                      scale: successEffectProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.45, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.successEffectRing}>
                <Ionicons color="#FFF4A8" name="paw" size={58} />
              </View>
              <Ionicons
                color="#FFD34D"
                name="sparkles"
                size={48}
                style={styles.successSparkle}
              />
              <Text style={styles.successEffectText}>포착 성공!</Text>
            </Animated.View>
          )}

          {segmentationState === 'processing' && !showSuccessEffect && (
            <View style={styles.processingCard}>
              <ActivityIndicator color="#31533B" size="large" />
              <Text style={styles.processingTitle}>동물을 분리하고 있어요</Text>
              <Text style={styles.processingDescription}>
                첫 실행에서는 모델 준비에 잠시 시간이 걸릴 수 있어요
              </Text>
            </View>
          )}

          {segmentationState === 'error' && (
            <View style={styles.processingCard}>
              <Ionicons color="#7B6650" name="alert-circle-outline" size={44} />
              <Text style={styles.processingTitle}>동물을 분리하지 못했어요</Text>
              <Text style={styles.processingDescription}>
                {segmentationError}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void removeBackground(photoUri)}
                style={({ pressed }) => [
                  styles.segmentationRetryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.segmentationRetryText}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {showSuccessModal && segmentationState === 'success' && (
            <Animated.View
              style={[
                styles.successBottomSheet,
                {
                  paddingBottom: insets.bottom + 24,
                  transform: [{ translateY: bottomSheetTranslateY }],
                },
            ]}
          >
              <Image
                accessibilityLabel="이 이미지를 가지고 만들어볼까요?"
                resizeMode="contain"
                source={USE_PHOTO_PROMPT_IMAGE}
                style={styles.bottomSheetTitleImage}
              />
              <View style={styles.bottomSheetActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetry}
                style={({ pressed }) => [
                    styles.decisionButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={RETAKE_BUTTON_IMAGE}
                    style={styles.decisionButtonImage}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.decisionButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={USE_PHOTO_BUTTON_IMAGE}
                    style={styles.decisionButtonImage}
                  />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      )}

      {result === 'failure' && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Ionicons color="#7B6650" name="time-outline" size={46} />
            <Text style={styles.resultTitle}>포착 실패</Text>
            <Text style={styles.resultDescription}>
              {failureReason === 'attempts'
                ? '액자를 모두 사용했어요. 다시 도전해 보세요.'
                : '제한 시간이 지났어요. 다시 도전해 보세요.'}
            </Text>
            <View style={styles.resultActions}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>나가기</Text>
              </Pressable>
              <Pressable
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>다시 촬영</Text>
              </Pressable>
            </View>
          </View>
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
    right: 15,
    left: 15,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 5.27,
  },
  timerCard: {
    width: 191,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
  },
  timerBackground: {
    position: 'absolute',
    width: 191,
    height: 40,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  timerClock: {
    width: 18,
    height: 18,
  },
  timerText: {
    color: '#32322D',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '900',
  },
  timerTrack: {
    flex: 1,
    height: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#6C604D',
    borderRadius: 7,
    backgroundColor: '#FFF7DB',
  },
  timerProgress: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#F5BE20',
  },
  opportunityCard: {
    width: 140.71,
    height: 40,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5.27,
  },
  opportunityBackground: {
    position: 'absolute',
    width: 140.71,
    height: 40,
  },
  opportunityLabel: {
    width: 43.37,
    height: 14,
  },
  opportunityFrames: {
    flexDirection: 'row',
    columnGap: 3,
  },
  opportunityFrame: {
    width: 21.35,
    height: 21.35,
  },
  guideImage: {
    position: 'absolute',
    zIndex: 2,
    width: 267,
    height: 28,
    alignSelf: 'center',
  },
  cameraCard: {
    position: 'absolute',
    alignSelf: 'center',
    aspectRatio: CAMERA_CARD_ASPECT_RATIO,
    padding: 20,
    borderWidth: 3,
    borderColor: '#D5C6AF',
    borderRadius: 28,
    backgroundColor: '#FFFDF7',
  },
  cameraBezel: {
    flex: 1,
    padding: 8,
    paddingBottom: 38,
    borderWidth: 4,
    borderColor: '#302D2E',
    borderRadius: 14,
    backgroundColor: '#4A4648',
  },
  cameraViewport: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#252324',
    borderRadius: 9,
    backgroundColor: '#242224',
  },
  cameraBrand: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    left: 0,
    color: '#F5EEDF',
    fontFamily: 'monospace',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 249, 225, 0.72)',
    borderRadius: 999,
  },
  targetRingOuter: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  },
  pulseRing: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderWidth: 4,
    borderColor: '#FFF4C7',
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: 'rgba(255, 249, 225, 0.05)',
  },
  targetPoint: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(255, 201, 61, 0.3)',
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
    width: 80,
    height: 80,
  },
  successBottomSheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 4,
    borderRightWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#C8B998',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFCF5',
  },
  successOnlyScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: '#000000',
  },
  successPhotoDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 28, 14, 0.12)',
  },
  segmentedPreview: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 150,
    backgroundColor: '#E8F2D8',
  },
  previewCircle: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#FFF9E9',
  },
  segmentedPhoto: {
    width: '88%',
    height: '58%',
  },
  segmentedTitle: {
    marginTop: 18,
    color: '#31533B',
    fontSize: 26,
    fontWeight: '900',
  },
  segmentedDescription: {
    marginTop: 6,
    color: '#66805E',
    fontSize: 16,
    fontWeight: '700',
  },
  processingCard: {
    position: 'absolute',
    top: '38%',
    right: 28,
    left: 28,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    backgroundColor: '#FFF9E9',
  },
  processingTitle: {
    marginTop: 14,
    color: '#31533B',
    fontSize: 20,
    fontWeight: '900',
  },
  processingDescription: {
    marginTop: 8,
    color: '#66805E',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  segmentationRetryButton: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#31533B',
  },
  segmentationRetryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  successEffect: {
    position: 'absolute',
    top: '37%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEffectRing: {
    width: 138,
    height: 138,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 7,
    borderColor: '#FFD34D',
    borderRadius: 69,
    backgroundColor: 'rgba(49, 83, 59, 0.78)',
    shadowColor: '#FFD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  successSparkle: {
    position: 'absolute',
    top: -18,
    right: -22,
  },
  successEffectText: {
    marginTop: 18,
    color: '#FFF4A8',
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  bottomSheetTitleImage: {
    width: 194,
    height: 28,
  },
  bottomSheetActions: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 1.74,
    columnGap: 4,
  },
  decisionButton: {
    flex: 1,
    aspectRatio: 80 / 27,
  },
  decisionButtonImage: {
    width: '100%',
    height: '100%',
  },
  throwLabel: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#987A50',
    fontSize: 14,
    fontWeight: '700',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(10, 18, 10, 0.7)',
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    padding: 26,
    borderWidth: 4,
    borderColor: '#D2BE8E',
    borderRadius: 24,
    backgroundColor: '#FFF4DA',
  },
  resultTitle: {
    marginTop: 10,
    color: '#31533B',
    fontSize: 28,
    fontWeight: '900',
  },
  resultDescription: {
    marginTop: 8,
    color: '#5E6E62',
    fontSize: 15,
    textAlign: 'center',
  },
  resultActions: {
    flexDirection: 'row',
    marginTop: 24,
    columnGap: 10,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: '#31533B',
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#31533B',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: '#31533B',
    borderRadius: 12,
    backgroundColor: '#31533B',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
});
