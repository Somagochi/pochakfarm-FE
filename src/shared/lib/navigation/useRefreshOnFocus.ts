import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

export function useRefreshOnFocus(
  refresh: () => void | Promise<unknown>,
) {
  const isInitialFocus = useRef(true);
  const refreshRef = useRef(refresh);

  refreshRef.current = refresh;

  useFocusEffect(
    useCallback(() => {
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        return;
      }

      void refreshRef.current();
    }, []),
  );
}
