import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { env } from '@/src/shared/config/env';
import { getPreparedImageCacheSession } from '@/src/shared/lib/image/preparedImageCache';

import {
  getCachedFarmAnimalImages,
  getFarmAnimalImages,
  getFarmAnimalImageSize,
  prepareFarmAnimalImages,
  type FarmAnimalImage,
  type FarmAnimalImageSources,
} from '../lib/farmAnimalImages';
import type { FarmFloor, FarmType } from './types';

type ImageBatch = {
  batchKey: string;
  images: FarmAnimalImageSources;
  isPrepared: boolean;
  displayed: ReadonlySet<string>;
};

export function useFarmAnimalImages({
  type,
  floors,
  imageWidth,
  imageHeight,
}: {
  type: FarmType;
  floors: readonly FarmFloor[];
  imageWidth: number;
  imageHeight: number;
}) {
  const manifestKey = JSON.stringify(useMemo(() => getFarmAnimalImages(floors), [floors]));
  // API가 새 객체를 반환해도 동일한 동물·URL의 준비 상태는 유지합니다.
  const manifest = useMemo(() => JSON.parse(manifestKey) as FarmAnimalImage[], [manifestKey]);
  const { maxWidth, maxHeight } = getFarmAnimalImageSize(imageWidth, imageHeight);
  const size = useMemo(() => ({ maxWidth, maxHeight }), [maxWidth, maxHeight]);
  const session = getPreparedImageCacheSession();
  const resourceKey = JSON.stringify([
    session, type, size.maxWidth, size.maxHeight, manifest.map((image) => image.key),
  ]);
  const batchIdentity = useRef({ resourceKey, generation: 0 });
  if (batchIdentity.current.resourceKey !== resourceKey) {
    batchIdentity.current = {
      resourceKey,
      generation: batchIdentity.current.generation + 1,
    };
  }
  // 같은 농장으로 돌아와도 이전 표시 요청의 콜백은 새 배치에 반영하지 않습니다.
  const batchKey = JSON.stringify([resourceKey, batchIdentity.current.generation]);
  const initialBatch = useMemo<ImageBatch>(() => {
    const images = getCachedFarmAnimalImages(manifest, size);
    return {
      batchKey,
      images,
      isPrepared: images.size === manifest.length,
      displayed: new Set(),
    };
  }, [batchKey, manifest, size]);
  const [storedBatch, setBatch] = useState<ImageBatch>(initialBatch);
  const batch = storedBatch.batchKey === batchKey ? storedBatch : initialBatch;
  const currentBatchKey = useRef(batchKey);
  currentBatchKey.current = batchKey;
  const preparationStart = useRef<{ batchKey: string; time: number } | null>(null);
  if (env.measureFarmLoading && preparationStart.current?.batchKey !== batchKey) {
    preparationStart.current = { batchKey, time: performance.now() };
  }

  useEffect(() => {
    let isCancelled = false;
    if (initialBatch.isPrepared) return;

    void prepareFarmAnimalImages(type, manifest, size).then((images) => {
      if (
        isCancelled || currentBatchKey.current !== batchKey ||
        session !== getPreparedImageCacheSession()
      ) return;
      setBatch((current) => {
        if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return current;
        const previous = current.batchKey === batchKey ? current : initialBatch;
        // 표시 오류로 바꾼 기본 이미지를 원래 참조로 덮어쓰지 않습니다.
        const nextImages = new Map(images);
        for (const [key, source] of previous.images) {
          if (source === null) nextImages.set(key, null);
        }
        return { ...previous, images: nextImages, isPrepared: true };
      });
    }).catch(() => {
      // 세션이 바뀐 이미지 그룹은 공개하지 않습니다.
    });

    return () => { isCancelled = true; };
  }, [batchKey, initialBatch, manifest, session, size, type]);

  const markDisplayed = useCallback((key: string) => {
    if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return;
    setBatch((current) => {
      if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return current;
      const previous = current.batchKey === batchKey ? current : initialBatch;
      if (!previous.images.has(key) || previous.displayed.has(key)) return previous;
      return { ...previous, displayed: new Set([...previous.displayed, key]) };
    });
  }, [batchKey, initialBatch, session]);
  const markFailed = useCallback((key: string) => {
    if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return;
    setBatch((current) => {
      if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return current;
      const previous = current.batchKey === batchKey ? current : initialBatch;
      if (!previous.images.has(key) || previous.images.get(key) === null) return previous;
      const images = new Map(previous.images);
      images.set(key, null);
      const displayed = new Set(previous.displayed);
      displayed.delete(key);
      return { ...previous, images, displayed };
    });
  }, [batchKey, initialBatch, session]);
  const isReady = batch.isPrepared && manifest.every((image) => batch.displayed.has(image.key));

  useEffect(() => {
    if (!isReady || !env.measureFarmLoading) return;
    const start = preparationStart.current;
    if (start?.batchKey !== batchKey) return;
    console.info('[farm-images:displayed]', JSON.stringify({
      farm_type: type,
      duration_ms: Math.round(performance.now() - start.time),
      animal_count: manifest.length,
    }));
  }, [batchKey, isReady, manifest.length, type]);

  return {
    batchKey,
    images: batch.images,
    isPrepared: batch.isPrepared,
    isReady,
    markDisplayed,
    markFailed,
  };
}
