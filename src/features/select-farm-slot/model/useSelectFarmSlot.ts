import { useState } from 'react';

export type SelectedFarmSlot = {
  floorNumber: number;
  slotNumber: number;
};

export function useSelectFarmSlot() {
  const [selectedSlot, setSelectedSlot] = useState<SelectedFarmSlot | null>(
    null,
  );

  const selectSlot = (floorNumber: number, slotNumber: number) => {
    setSelectedSlot((currentSlot) => {
      if (
        currentSlot?.floorNumber === floorNumber &&
        currentSlot.slotNumber === slotNumber
      ) {
        return null;
      }

      return { floorNumber, slotNumber };
    });
  };

  return { selectedSlot, selectSlot };
}
