import { useState } from 'react';

import { formatRequestError } from '@/src/shared/api/formatRequestError';

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
