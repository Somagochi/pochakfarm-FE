export type FarmDragSlotBounds = {
  left: number;
  top: number;
  size: number;
};

export function findFarmDragSlot(
  slots: FarmDragSlotBounds[],
  x: number,
  y: number,
) {
  'worklet';

  return slots.findIndex(
    (slot) =>
      x >= slot.left && x <= slot.left + slot.size &&
      y >= slot.top && y <= slot.top + slot.size,
  );
}
