import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

import { ApiError } from '@/src/shared/api/client';

export async function downloadCaptureCardImage(cardImageUrl: string) {
  if (!FileSystem.cacheDirectory) {
    throw new Error('이미지 캐시 경로를 사용할 수 없습니다.');
  }

  const destination = `${FileSystem.cacheDirectory}capture-card-${Crypto.randomUUID()}.png`;
  const download = await FileSystem.downloadAsync(
    cardImageUrl,
    destination,
  );

  if (download.status < 200 || download.status >= 300) {
    throw new ApiError(
      '생성된 카드 이미지를 내려받지 못했습니다.',
      download.status,
    );
  }

  return download.uri;
}
