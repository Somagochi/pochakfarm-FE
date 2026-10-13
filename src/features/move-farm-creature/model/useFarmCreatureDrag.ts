import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { FarmAnimal } from '@/src/entities/farm';
import {
  findFarmDragSlot,
  type FarmDragSlotBounds,
} from '../lib/findFarmDragSlot';

export type FarmDragSlot = FarmDragSlotBounds & {
  animal: FarmAnimal | null;
  floorNumber: number;
  slotNumber: number;
};

type Options = {
  enabled: boolean;
  slots: FarmDragSlot[];
  scale: number;
  onStart?: () => void;
  onMove?: (animalId: number, floorNumber: number, slotNumber: number) => void;
};

export function useFarmCreatureDrag({
  enabled,
  slots,
  scale,
  onStart,
  onMove,
}: Options) {
  const canvasRef = useAnimatedRef<View>();
  const [draggedSlot, setDraggedSlot] = useState<FarmDragSlot | null>(null);
  const callbacks = useRef({ onStart, onMove });
  callbacks.current = { onStart, onMove };
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const sourceIndex = useSharedValue(-1);
  const active = useSharedValue(false);

  const startDrag = useCallback((slot: FarmDragSlot) => {
    setDraggedSlot(slot);
    callbacks.current.onStart?.();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      .catch(() => undefined);
  }, []);

  const finishDrag = useCallback((
    source: FarmDragSlot,
    target: FarmDragSlot | null,
  ) => {
    setDraggedSlot(null);
    if (
      source.animal && target &&
      (source.floorNumber !== target.floorNumber ||
        source.slotNumber !== target.slotNumber)
    ) {
      callbacks.current.onMove?.(
        source.animal.animalId,
        target.floorNumber,
        target.slotNumber,
      );
    }
  }, []);
  const cancelDrag = useCallback(() => setDraggedSlot(null), []);

  // Changing farms, leaving the screen or removing a slot cancels a pending drag.
  useEffect(() => {
    active.value = false;
    sourceIndex.value = -1;
    setDraggedSlot(null);
  }, [active, enabled, slots, sourceIndex]);

  const gesture = useMemo(() => Gesture.Pan()
    .enabled(enabled)
    .maxPointers(1)
    .activateAfterLongPress(350)
    .onTouchesDown((event, manager) => {
      const touch = event.allTouches[0];
      const canvas = measure(canvasRef);
      if (!touch || !canvas || event.numberOfTouches !== 1) {
        manager.fail();
        return;
      }
      const index = findFarmDragSlot(
        slots,
        touch.absoluteX - canvas.pageX,
        touch.absoluteY - canvas.pageY,
      );
      if (index < 0 || !slots[index].animal) {
        manager.fail();
        return;
      }
      sourceIndex.value = index;
    })
    .onStart((event) => {
      const canvas = measure(canvasRef);
      if (!canvas || sourceIndex.value < 0) return;
      originX.value = canvas.pageX;
      originY.value = canvas.pageY;
      dragX.value = event.absoluteX - canvas.pageX;
      dragY.value = event.absoluteY - canvas.pageY;
      active.value = true;
      runOnJS(startDrag)(slots[sourceIndex.value]);
    })
    .onUpdate((event) => {
      if (!active.value) return;
      dragX.value = event.absoluteX - originX.value;
      dragY.value = event.absoluteY - originY.value;
    })
    .onEnd((event, success) => {
      if (!active.value || !success || sourceIndex.value < 0) return;
      const targetIndex = findFarmDragSlot(
        slots,
        event.absoluteX - originX.value,
        event.absoluteY - originY.value,
      );
      runOnJS(finishDrag)(
        slots[sourceIndex.value],
        targetIndex < 0 ? null : slots[targetIndex],
      );
    })
    .onFinalize(() => {
      if (active.value) runOnJS(cancelDrag)();
      active.value = false;
      sourceIndex.value = -1;
    }), [
      active, cancelDrag, canvasRef, dragX, dragY, enabled, finishDrag,
      originX, originY, slots, sourceIndex, startDrag,
    ]);

  const dragStyle = useAnimatedStyle(() => ({
    opacity: active.value ? 0.9 : 0,
    transform: [
      { translateX: dragX.value - 40 * scale },
      { translateY: dragY.value - 36.5 * scale },
      { scale: 1.08 },
    ],
  }));

  return { canvasRef, draggedSlot, dragStyle, gesture };
}
