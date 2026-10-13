import { useCallback, useEffect, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation, Easing, interpolateColor, ReduceMotion,
  runOnJS, runOnUI, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import { calculateCaptureThrow, judgeCaptureLanding } from '../lib/calculateCaptureThrow';
import type { CaptureThrowGeometry } from '../lib/calculateCaptureThrow';

export type CaptureLanding = ReturnType<typeof judgeCaptureLanding> & { round: number };

export type CaptureGameAnimationOptions = {
  geometry: CaptureThrowGeometry;
  ringDurationMs: number;
  successDistance: number;
  arcHeight: number;
  dragLimitX: number;
  dragLimitUp: number;
  dragLimitDown: number;
  throwsUsed: number;
  ended: boolean;
  onThrowStart: () => void;
  onLanding: (landing: CaptureLanding) => void;
  onReady: () => void;
};

export function useCaptureGameAnimation({
  geometry, ringDurationMs, successDistance, arcHeight,
  dragLimitX, dragLimitUp, dragLimitDown,
  throwsUsed, ended, onThrowStart, onLanding, onReady,
}: CaptureGameAnimationOptions) {
  const activeRef = useRef(true);
  const notifyThrowStart = useCallback(() => {
    if (activeRef.current) onThrowStart();
  }, [onThrowStart]);
  const notifyLanding = useCallback((landing: CaptureLanding) => {
    if (activeRef.current) onLanding(landing);
  }, [onLanding]);
  const notifyReady = useCallback(() => {
    if (activeRef.current) onReady();
  }, [onReady]);
  const ring = useSharedValue(1);
  const phase = useSharedValue<'idle' | 'flying' | 'waiting' | 'ended'>('idle');
  const mounted = useSharedValue(true);
  const round = useSharedValue(throwsUsed);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);
  const destination = useSharedValue({ x: 0, y: 0, rotation: 360 });
  const startRing = useCallback(() => {
    'worklet';
    cancelAnimation(ring);
    ring.value = 1;
    ring.value = withRepeat(withSequence(
      withTiming(0, { duration: ringDurationMs, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }),
      withDelay(120, withTiming(1, { duration: 0, reduceMotion: ReduceMotion.Never }), ReduceMotion.Never),
    ), -1, false, undefined, ReduceMotion.Never);
  }, [ring, ringDurationMs]);

  useEffect(() => {
    activeRef.current = true;
    mounted.value = true;
    phase.value = 'idle';
    return () => {
      activeRef.current = false;
      runOnUI(() => {
        'worklet';
        mounted.value = false;
        phase.value = 'ended';
        cancelAnimation(ring);
        cancelAnimation(progress);
        cancelAnimation(opacity);
        cancelAnimation(dragX);
        cancelAnimation(dragY);
      })();
    };
  }, [dragX, dragY, mounted, opacity, phase, progress, ring]);

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      if (mounted.value && (phase.value === 'idle' || phase.value === 'flying')) startRing();
    })();
  }, [mounted, phase, startRing]);

  useEffect(() => {
    // 늦게 반영된 JS 시도 횟수가 이미 시작한 UI 투척 번호를 되돌리지 않게 합니다.
    round.value = Math.max(round.value, throwsUsed);
  }, [round, throwsUsed]);
  useEffect(() => {
    if (!ended) return;
    runOnUI(() => {
      'worklet';
      phase.value = 'ended';
      cancelAnimation(ring);
      cancelAnimation(progress);
      cancelAnimation(opacity);
    })();
  }, [ended, opacity, phase, progress, ring]);

  const returnToOrigin = useCallback(() => {
    'worklet';
    dragX.value = withSpring(0, { duration: 300, dampingRatio: 0.65, reduceMotion: ReduceMotion.Never });
    dragY.value = withSpring(0, { duration: 300, dampingRatio: 0.65, reduceMotion: ReduceMotion.Never });
  }, [dragX, dragY]);

  const respawnOnUI = useCallback((hideFirst: boolean) => {
      'worklet';
      if (!mounted.value || phase.value === 'ended') return;
      const reset = () => {
        'worklet';
        if (!mounted.value || phase.value === 'ended') return;
        dragX.value = 0; dragY.value = 0; progress.value = 0;
        ring.value = 1;
        opacity.value = withTiming(1, { duration: 140, reduceMotion: ReduceMotion.Never }, (finished) => {
          if (!finished || !mounted.value || phase.value === 'ended') return;
          phase.value = 'idle';
          startRing();
          runOnJS(notifyReady)();
        });
      };
      if (hideFirst) opacity.value = withTiming(0, { duration: 140, reduceMotion: ReduceMotion.Never }, (finished) => { if (finished) reset(); });
      else reset();
  }, [dragX, dragY, mounted, notifyReady, opacity, phase, progress, ring, startRing]);

  const respawn = useCallback((hideFirst: boolean) => { runOnUI(respawnOnUI)(hideFirst); }, [respawnOnUI]);

  const gesture = Gesture.Pan().minDistance(0).maxPointers(1)
    .onUpdate((event) => {
      if (!mounted.value || phase.value !== 'idle') return;
      cancelAnimation(dragX); cancelAnimation(dragY);
      dragX.value = Math.max(-dragLimitX, Math.min(dragLimitX, event.translationX * 0.12));
      dragY.value = Math.max(-dragLimitUp, Math.min(dragLimitDown, event.translationY * 0.1));
    })
    .onEnd((event) => {
      if (!mounted.value || phase.value !== 'idle') return;
      const flight = calculateCaptureThrow(event.translationX, event.translationY, event.velocityX / 1000, event.velocityY / 1000, geometry);
      if (!flight.valid) { returnToOrigin(); return; }
      phase.value = 'flying';
      round.value++;
      destination.value = { x: flight.destinationX, y: flight.destinationY, rotation: flight.rotation };
      progress.value = 0;
      runOnJS(notifyThrowStart)();
      progress.value = withTiming(1, { duration: flight.durationMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (!finished || !mounted.value || phase.value !== 'flying') return;
        // 카드 위치·회전·크기와 동일한 비행 진행값의 완료 시점에 판정합니다.
        phase.value = 'waiting';
        cancelAnimation(ring);
        const ringScale = ring.value;
        const judgment = judgeCaptureLanding(ringScale, flight.landingDistance, successDistance);
        if (judgment.isPositionMatched && !judgment.isTimingMatched) opacity.value = 0;
        if (!judgment.isPositionMatched && round.value < 3) respawnOnUI(true);
        runOnJS(notifyLanding)({ ...judgment, round: round.value });
      });
    })
    .onFinalize((_event, success) => {
      if (!success && phase.value === 'idle' && mounted.value) returnToOrigin();
    });

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value * 0.95 }] }));
  const ringImageStyle = useAnimatedStyle(() => ({ tintColor: interpolateColor(ring.value,
    [0, 0.333, 0.334, 0.666, 0.667, 1],
    ['#628D38', '#628D38', '#E28112', '#E28112', '#D93920', '#D93920'], 'RGB', { gamma: 1 }),
  }));
  const cardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const positionEase = 1 - Math.pow(1 - p, 3);
    const scaleEase = 1 - Math.pow(1 - p, 2);
    const arcProgress = p < 0.48 ? p / 0.48 : (p - 0.48) / 0.52;
    const arc = p < 0.48 ? arcHeight * (1 - Math.pow(1 - arcProgress, 2)) : arcHeight * (1 - arcProgress * arcProgress);
    return { opacity: opacity.value, transform: [
      { translateX: dragX.value + (destination.value.x - dragX.value) * positionEase },
      { translateY: dragY.value + (destination.value.y - dragY.value) * positionEase },
      { translateY: arc }, { rotate: `${destination.value.rotation * p}deg` }, { scale: 1 - 0.28 * scaleEase },
    ] };
  });

  // 초 단위 JS 타이머가 UI의 투척 상태 반영보다 먼저 실행되는 경합을 막습니다.
  const isThrowInProgress = useCallback(() => phase.value !== 'idle', [phase]);

  return { gesture, ringStyle, ringImageStyle, cardStyle, respawn, isThrowInProgress };
}
