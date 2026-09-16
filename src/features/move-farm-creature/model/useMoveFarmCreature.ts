import { useState } from 'react';

import { formatRequestError } from '@/src/shared/api/formatRequestError';
import { captureAnalyticsEvent } from '@/src/shared/lib/analytics';

import { moveFarmCreatureApi } from '../api/moveFarmCreatureApi';

type MoveFarmCreatureTarget = {
  floorNumber: number;
  slotNumber: number;
};

export function useMoveFarmCreature() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  async function moveCreature(
    animalId: number,
    target: MoveFarmCreatureTarget,
  ) {
    if (isMoving) return false;

    try {
      setIsMoving(true);
      setErrorMessage(null);
      await moveFarmCreatureApi(animalId, {
        targetFloorNum: target.floorNumber,
        targetSlotNum: target.slotNumber,
      });
      captureAnalyticsEvent('farm_creature_moved', {
        animal_id: animalId,
        target_floor_number: target.floorNumber,
        target_slot_number: target.slotNumber,
      });
      return true;
    } catch (error) {
      setErrorMessage(
        formatRequestError(`PATCH /api/animals/${animalId}/slot`, error),
      );
      return false;
    } finally {
      setIsMoving(false);
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    errorMessage,
    isMoving,
    moveCreature,
  };
}
