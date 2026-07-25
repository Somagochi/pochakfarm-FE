import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const FARM_UNLOCK_STORAGE_KEY = 'farm-unlocked-area-count';
const DEFAULT_UNLOCKED_AREA_COUNT = 1;
const MAX_AREA_COUNT = 4;

export function useFarmAreaUnlock() {
  const [unlockedAreaCount, setUnlockedAreaCount] = useState(
    DEFAULT_UNLOCKED_AREA_COUNT,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadUnlockedAreaCount() {
      try {
        const storedValue = await AsyncStorage.getItem(
          FARM_UNLOCK_STORAGE_KEY,
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
  }, []);

  const unlockArea = useCallback(
    async (areaNumber: number) => {
      if (!isReady || areaNumber !== unlockedAreaCount + 1) {
        return false;
      }

      setUnlockedAreaCount(areaNumber);

      try {
        await AsyncStorage.setItem(
          FARM_UNLOCK_STORAGE_KEY,
          String(areaNumber),
        );
        return true;
      } catch {
        setUnlockedAreaCount(unlockedAreaCount);
        return false;
      }
    },
    [isReady, unlockedAreaCount],
  );

  return {
    isReady,
    unlockArea,
    unlockedAreaCount,
  };
}
