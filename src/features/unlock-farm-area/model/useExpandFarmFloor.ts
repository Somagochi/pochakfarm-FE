import { useRef, useState } from 'react';

import type { FarmType } from '@/src/entities/farm';

import { expandFarmFloorApi } from '../api/expandFarmFloorApi';

export function useExpandFarmFloor(type: FarmType) {
  const [isExpanding, setIsExpanding] = useState(false);
  const isRequestingRef = useRef(false);

  async function expandFloor() {
    if (isRequestingRef.current) {
      return false;
    }

    isRequestingRef.current = true;
    setIsExpanding(true);

    try {
      await expandFarmFloorApi(type);
      return true;
    } finally {
      isRequestingRef.current = false;
      setIsExpanding(false);
    }
  }

  return {
    expandFloor,
    isExpanding,
  };
}
