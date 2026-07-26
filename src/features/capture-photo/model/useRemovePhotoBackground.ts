import { useCallback, useState } from 'react';

import { removePhotoBackground } from './subjectSegmentation';

type RemoveBackgroundState = 'idle' | 'processing' | 'success' | 'error';

export function useRemovePhotoBackground() {
  const [state, setState] = useState<RemoveBackgroundState>('idle');
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const removeBackground = useCallback(async (photoUri: string) => {
    setState('processing');
    setResultUri(null);
    setErrorMessage(null);

    try {
      const uri = await removePhotoBackground(photoUri);
      setResultUri(uri);
      setState('success');
      return uri;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '사진에서 동물을 분리하지 못했습니다.';
      setErrorMessage(message);
      setState('error');
      return null;
    }
  }, []);

  return {
    errorMessage,
    removeBackground,
    resultUri,
    state,
  };
}
