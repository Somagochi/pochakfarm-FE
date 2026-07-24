import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CAPTURE_SECONDS = 10;
const FRAME_SIZE = 96;
const TARGET_SIZE = 310;
const SUCCESS_DISTANCE = 72;
const SUCCESS_SCALE = 0.38;

type CaptureResult = 'success' | 'failure' | null;

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
  const dragPosition = useRef(new Animated.ValueXY()).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseScaleValue = useRef(1);
  const resultRef = useRef<CaptureResult>(null);

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
      y: height - insets.bottom - 172,
    }),
    [height, insets.bottom, width],
  );

  const finishGame = (nextResult: Exclude<CaptureResult, null>) => {
    if (resultRef.current) {
      return;
    }

    resultRef.current = nextResult;
    setResult(nextResult);
  };

  useEffect(() => {
    if (result) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          finishGame('failure');
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !resultRef.current,
        onMoveShouldSetPanResponder: () => !resultRef.current,
        onPanResponderMove: (_, gestureState) => {
          dragPosition.setValue({
            x: gestureState.dx,
            y: gestureState.dy,
          });
        },
        onPanResponderRelease: (_, gestureState) => {
          const frameCenterX =
            frameOrigin.x + gestureState.dx + FRAME_SIZE / 2;
          const frameCenterY =
            frameOrigin.y + gestureState.dy + FRAME_SIZE / 2;
          const distance = Math.hypot(
            frameCenterX - targetCenter.x,
            frameCenterY - targetCenter.y,
          );
          const isPositionMatched = distance <= SUCCESS_DISTANCE;
          const isTimingMatched = pulseScaleValue.current <= SUCCESS_SCALE;

          if (isPositionMatched && isTimingMatched) {
            finishGame('success');
            return;
          }

          Animated.spring(dragPosition, {
            toValue: { x: 0, y: 0 },
            speed: 18,
            bounciness: 8,
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragPosition, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      }),
    [dragPosition, frameOrigin, targetCenter],
  );

  return (
    <View style={styles.container}>
      <Image
        resizeMode="cover"
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.dimOverlay} />

      <View style={[styles.topControls, { top: insets.top + 12 }]}>
        <Pressable
          accessibilityLabel="포착 종료"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons color="#31533B" name="close" size={34} />
        </Pressable>
        <Ionicons color="#FFF9E9" name="flash" size={42} />
      </View>

      <View style={[styles.timerCard, { top: insets.top + 96 }]}>
        <View style={styles.timerRow}>
          <Ionicons color="#FFF9E9" name="stopwatch-outline" size={34} />
          <Text style={styles.timerText}>{secondsLeft}s</Text>
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

      <Text style={[styles.guideText, { top: insets.top + 192 }]}>
        액자를 던져 포착하세요!
      </Text>

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
        <View style={[styles.targetRing, styles.targetRingMiddle]} />
        <View style={[styles.targetRing, styles.targetRingInner]} />
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

      <Animated.View
        accessibilityLabel="포착 액자"
        accessibilityRole="button"
        style={[
          styles.draggableFrame,
          {
            left: frameOrigin.x,
            top: frameOrigin.y,
            transform: dragPosition.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.frameOuter}>
          <View style={styles.frameInner}>
            <Ionicons color="#FFF4DA" name="paw" size={34} />
          </View>
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

      {result && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Ionicons
              color={result === 'success' ? '#D99A00' : '#7B6650'}
              name={result === 'success' ? 'sparkles' : 'time-outline'}
              size={46}
            />
            <Text style={styles.resultTitle}>
              {result === 'success' ? '포착 성공!' : '포착 실패'}
            </Text>
            <Text style={styles.resultDescription}>
              {result === 'success'
                ? '동물을 성공적으로 포착했어요.'
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
    backgroundColor: '#000000',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 24, 12, 0.14)',
  },
  topControls: {
    position: 'absolute',
    right: 18,
    left: 16,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderBottomWidth: 4,
    borderColor: '#BBAE8C',
    backgroundColor: '#FFF4DA',
  },
  timerCard: {
    position: 'absolute',
    alignSelf: 'center',
    width: 164,
    zIndex: 2,
    padding: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 249, 225, 0.55)',
    borderRadius: 24,
    backgroundColor: 'rgba(28, 48, 23, 0.88)',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 10,
  },
  timerText: {
    color: '#FFC83D',
    fontSize: 34,
    fontWeight: '700',
  },
  timerTrack: {
    height: 10,
    marginTop: 8,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  timerProgress: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#FFC83D',
  },
  guideText: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
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
  targetRingMiddle: {
    width: TARGET_SIZE * 0.72,
    height: TARGET_SIZE * 0.72,
  },
  targetRingInner: {
    width: TARGET_SIZE * 0.44,
    height: TARGET_SIZE * 0.44,
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
  draggableFrame: {
    position: 'absolute',
    zIndex: 4,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#FFF9E9',
    borderRadius: FRAME_SIZE / 2,
    backgroundColor: 'rgba(255, 249, 225, 0.94)',
  },
  frameOuter: {
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#B58A45',
    backgroundColor: '#E8C77A',
  },
  frameInner: {
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#233D2B',
    backgroundColor: '#31533B',
  },
  throwLabel: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
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
