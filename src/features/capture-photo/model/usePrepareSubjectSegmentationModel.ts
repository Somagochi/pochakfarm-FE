import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  downloadSubjectSegmentationModel,
  isSubjectSegmentationModelAvailable,
} from './subjectSegmentation';

type PreparationState = 'checking' | 'downloading' | 'ready' | 'error';

export function usePrepareSubjectSegmentationModel(enabled: boolean) {
  const [state, setState] = useState<PreparationState>(
    Platform.OS === 'android' ? 'checking' : 'ready',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prepare = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (Platform.OS !== 'android') {
      setState('ready');
      return;
    }

    try {
      setErrorMessage(null);
      setState('checking');

      if (await isSubjectSegmentationModelAvailable()) {
        setState('ready');
        return;
      }

      setState('downloading');
      await downloadSubjectSegmentationModel();
      setState('ready');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '누끼 제거 모델을 다운로드하지 못했습니다.',
      );
      setState('error');
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      void prepare();
    }
  }, [enabled, prepare]);

  return { errorMessage, prepare, state };
}
