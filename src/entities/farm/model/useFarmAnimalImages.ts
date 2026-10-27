import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    };
  }, [batchKey, manifest, size]);
  const [storedBatch, setBatch] = useState<ImageBatch>(initialBatch);
  const batch = storedBatch.batchKey === batchKey ? storedBatch : initialBatch;
  const currentBatchKey = useRef(batchKey);
  currentBatchKey.current = batchKey;
  const currentBatch = useRef(batch);
  currentBatch.current = batch;
  const displayed = useRef({ batchKey, keys: new Set<string>() });
  if (displayed.current.batchKey !== batchKey) {
    displayed.current = { batchKey, keys: new Set() };
  }
  const [, notifyDisplayComplete] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    if (initialBatch.isPrepared) return;

    void prepareFarmAnimalImages(manifest, size).then((images) => {
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
  }, [batchKey, initialBatch, manifest, session, size]);

  const markDisplayed = useCallback((key: string) => {
    if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return;
    const completed = displayed.current.keys;
    if (!currentBatch.current.images.has(key) || completed.has(key)) return;
    completed.add(key);
    // 개별 이미지 완료는 기록만 하고, 모두 표시됐을 때 한 번만 렌더링합니다.
    if (manifest.every((image) => completed.has(image.key))) {
      notifyDisplayComplete((revision) => revision + 1);
    }
  }, [batchKey, manifest, session]);
  const markFailed = useCallback((key: string) => {
    if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return;
    setBatch((current) => {
      if (currentBatchKey.current !== batchKey || session !== getPreparedImageCacheSession()) return current;
      const previous = current.batchKey === batchKey ? current : initialBatch;
      if (!previous.images.has(key) || previous.images.get(key) === null) return previous;
      const images = new Map(previous.images);
      images.set(key, null);
      displayed.current.keys.delete(key);
      return { ...previous, images };
    });
  }, [batchKey, initialBatch, session]);
  const isReady = batch.isPrepared && manifest.every((image) => displayed.current.keys.has(image.key));

  return {
    batchKey,
    images: batch.images,
    isPrepared: batch.isPrepared,
    isReady,
    markDisplayed,
    markFailed,
  };
}
