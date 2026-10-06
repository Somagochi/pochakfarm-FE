import type { ImageRef } from 'expo-image';
import { Dimensions, PixelRatio } from 'react-native';

import { env } from '@/src/shared/config/env';
import {
  getPreparedImage,
  getPreparedImageCacheSession,
  prepareImage,
  type PreparedImageSize,
} from '@/src/shared/lib/image/preparedImageCache';

import type { FarmAnimal, FarmFloor, FarmType } from '../model/types';

export type FarmAnimalImage = { key: string; uri: string | null };
export type FarmAnimalImageSources = ReadonlyMap<string, ImageRef | null>;

export function getFarmAnimalImageKey(
  floorNumber: number,
  slotNumber: number,
  animal: FarmAnimal,
) {
  return JSON.stringify([
    floorNumber, slotNumber, animal.animalId, animal.animalImageUrl ?? null,
  ]);
}

export function getFarmAnimalImages(floors: readonly FarmFloor[]): FarmAnimalImage[] {
  return floors.flatMap((floor) => floor.unlocked ? floor.slots.flatMap((slot) => (
    slot.animal ? [{
      key: getFarmAnimalImageKey(floor.floorNum, slot.slotNum, slot.animal),
      uri: slot.animal.animalImageUrl || null,
    }] : []
  )) : []);
}

export function getFarmAnimalImageSize(
  imageWidth = 80 * (Dimensions.get('window').width / 360),
  imageHeight = 73 * (Dimensions.get('window').width / 360),
): PreparedImageSize {
  // 드래그 확대에도 선명도를 유지하면서 원본 전체를 디코딩하지 않습니다.
  const density = PixelRatio.get() * 1.2;
  return {
    maxWidth: Math.max(1, Math.ceil(imageWidth * density)),
    maxHeight: Math.max(1, Math.ceil(imageHeight * density)),
  };
}

export function getCachedFarmAnimalImages(
  images: readonly FarmAnimalImage[],
  size: PreparedImageSize,
) {
  const sources = new Map<string, ImageRef | null>();
  for (const image of images) {
    if (image.uri === null) {
      sources.set(image.key, null);
      continue;
    }
    const cached = getPreparedImage(image.uri, size);
    if (cached) sources.set(image.key, cached);
  }
  return sources;
}

export async function prepareFarmAnimalImages(
  type: FarmType,
  images: readonly FarmAnimalImage[],
  size: PreparedImageSize,
): Promise<FarmAnimalImageSources> {
  const session = getPreparedImageCacheSession();
  const startedAt = env.measureFarmLoading ? performance.now() : null;
  const memoryHits = images.filter((image) => (
    image.uri !== null && getPreparedImage(image.uri, size) !== undefined
  )).length;
  let failedCount = 0;
  const sources = await Promise.all(images.map(async (image) => {
    if (image.uri === null) return [image.key, null] as const;
    try {
      return [image.key, await prepareImage(image.uri, size)] as const;
    } catch {
      // 실패한 동물도 준비된 기본 이미지로 함께 표시할 수 있습니다.
      failedCount += 1;
      return [image.key, null] as const;
    }
  }));
  if (session !== getPreparedImageCacheSession()) {
    throw new Error('로그인 상태가 변경되었습니다.');
  }
  if (startedAt !== null) {
    console.info('[farm-images:prepared]', JSON.stringify({
      farm_type: type,
      duration_ms: Math.round(performance.now() - startedAt),
      animal_count: images.length,
      memory_hits: memoryHits,
      failed_count: failedCount,
    }));
  }
  return new Map(sources);
}
