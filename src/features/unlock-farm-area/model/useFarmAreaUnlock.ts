import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const FARM_UNLOCK_STORAGE_KEY = 'farm-unlocked-area-count';
const DEFAULT_UNLOCKED_AREA_COUNT = 1;
const MAX_AREA_COUNT = 4;

export function useFarmAreaUnlock(environment: 'land' | 'sea' | 'space') {
  const storageKey =
    environment === 'land'
      ? FARM_UNLOCK_STORAGE_KEY
      : `${FARM_UNLOCK_STORAGE_KEY}-${environment}`;
  const [unlockedAreaCount, setUnlockedAreaCount] = useState(
    DEFAULT_UNLOCKED_AREA_COUNT,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadUnlockedAreaCount() {
      try {
        const storedValue = await AsyncStorage.getItem(
          storageKey,
        );
        const parsedValue = Number(storedValue);

        if (
          Number.isInteger(parsedValue) &&
          parsedValue >= DEFAULT_UNLOCKED_AREA_COUNT &&
          parsedValue <= MAX_AREA_COUNT
        ) {
          setUnlockedAreaCount(parsedValue);
        }
      } finally {
        setIsReady(true);
      }
    }

    void loadUnlockedAreaCount();
  }, [storageKey]);

  const unlockArea = useCallback(
    async (areaNumber: number) => {
      if (!isReady || areaNumber !== unlockedAreaCount + 1) {
        return false;
      }

      setUnlockedAreaCount(areaNumber);

      try {
        await AsyncStorage.setItem(
          storageKey,
          String(areaNumber),
        );
        return true;
      } catch {
        setUnlockedAreaCount(unlockedAreaCount);
        return false;
      }
    },
    [isReady, storageKey, unlockedAreaCount],
  );

  return {
    isReady,
    unlockArea,
    unlockedAreaCount,
  };
}
