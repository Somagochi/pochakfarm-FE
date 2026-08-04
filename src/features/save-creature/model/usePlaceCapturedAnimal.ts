import { useState } from 'react';

import { ApiError } from '@/src/shared/api/client';
import { formatRequestError } from '@/src/shared/api/formatRequestError';

import {
  getCapturePlacementApi,
  placeCapturedAnimalApi,
  type PlaceCapturedAnimalRequest,
} from '../api/placeCapturedAnimalApi';

export type PlacementErrorCode =
  | 'FARM_SLOT_OCCUPIED'
  | 'ANIMAL_REPLACEMENT_CONFLICT'
  | 'CAPTURE_PLACEMENT_CONFLICT'
  | 'CAPTURE_NOT_PLACEABLE'
  | 'CAPTURE_ALREADY_PLACED';

type PlacementResult =
  | { ok: true }
  | { ok: false; code: string | null; message: string };

export function usePlaceCapturedAnimal() {
  const [isLoading, setIsLoading] = useState(false);

  async function placeAnimal(
    captureId: number,
    request: PlaceCapturedAnimalRequest,
  ): Promise<PlacementResult> {
    if (isLoading) {
      return {
        ok: false,
        code: null,
        message: '동물을 저장하고 있습니다.',
      };
    }

    try {
      setIsLoading(true);
      await placeCapturedAnimalApi(captureId, request);
      return { ok: true };
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null;

      if (
        code === 'CAPTURE_PLACEMENT_CONFLICT' ||
        code === 'CAPTURE_NOT_PLACEABLE' ||
        code === 'CAPTURE_ALREADY_PLACED'
      ) {
        try {
          await getCapturePlacementApi(captureId);
        } catch {
          // 원래 배치 충돌 응답을 사용자에게 유지합니다.
        }
      }

      return {
        ok: false,
        code,
        message: formatRequestError(
          `POST /api/captures/${captureId}/animal`,
          error,
        ),
      };
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, placeAnimal };
}
