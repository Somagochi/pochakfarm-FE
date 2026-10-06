import { Image as ExpoImage, type ImageRef } from 'expo-image';

export type PreparedImageSize = {
  maxWidth: number;
  maxHeight: number;
};

type PreparedImage = {
  image: ImageRef;
  estimatedBytes: number;
};

type ImagePreparation = {
  session: number;
  promise: Promise<ImageRef>;
};

type UriPreparation = {
  session: number;
  promise: Promise<void>;
};

const MAX_PREPARED_IMAGES = 32;
const MAX_PREPARED_IMAGE_BYTES = 16 * 1024 * 1024;
const preparedImages = new Map<string, PreparedImage>();
const imagePreparations = new Map<string, ImagePreparation>();
const uriPreparations = new Map<string, UriPreparation>();
let estimatedPreparedBytes = 0;
let cacheSession = 0;

function normalizeSize(size: PreparedImageSize): PreparedImageSize {
  if (
    !Number.isFinite(size.maxWidth) ||
    !Number.isFinite(size.maxHeight) ||
    size.maxWidth <= 0 ||
    size.maxHeight <= 0
  ) {
    throw new RangeError('이미지 준비 크기는 유한한 양수여야 합니다.');
  }

  return {
    maxWidth: Math.ceil(size.maxWidth),
    maxHeight: Math.ceil(size.maxHeight),
  };
}

function getImageKey(uri: string, size: PreparedImageSize) {
  return JSON.stringify([uri, size.maxWidth, size.maxHeight]);
}

function assertCacheSession(expectedSession: number) {
  if (expectedSession !== cacheSession) {
    throw new Error('이미지 준비 상태가 변경되었습니다.');
  }
}

function getFileUri(cachePath: string) {
  if (!cachePath.startsWith('/')) return cachePath;

  // 네이티브 캐시는 절대 경로를 반환하지만 loadAsync는 URI를 받습니다.
  return `file://${cachePath.split('/').map(encodeURIComponent).join('/')}`;
}

function prepareNativeImage(uri: string, size: PreparedImageSize, session: number) {
  const previous = uriPreparations.get(uri);
  const predecessor = previous?.session === session ? previous.promise : Promise.resolve();
  const promise = predecessor.then(async () => {
    assertCacheSession(session);
    // 크기가 다른 요청도 이전 다운로드가 끝난 다음 실제 디스크 캐시를 확인합니다.
    const cachePath = await ExpoImage.getCachePathAsync(uri).catch(() => null);
    assertCacheSession(session);
    const image = await ExpoImage.loadAsync(
      cachePath !== null ? getFileUri(cachePath) : uri,
      size,
    );
    assertCacheSession(session);
    return image;
  });
  const preparation: UriPreparation = {
    session,
    promise: promise
      .then(() => undefined, () => undefined)
      .finally(() => {
        if (uriPreparations.get(uri) === preparation) uriPreparations.delete(uri);
      }),
  };
  uriPreparations.set(uri, preparation);
  return promise;
}

function retainPreparedImage(key: string, image: ImageRef) {
  const scale = Number.isFinite(image.scale) && image.scale > 0 ? image.scale : 1;
  const estimatedBytes = Math.ceil(image.width * scale) * Math.ceil(image.height * scale) * 4;
  if (!Number.isFinite(estimatedBytes) || estimatedBytes > MAX_PREPARED_IMAGE_BYTES) return;

  preparedImages.set(key, { image, estimatedBytes });
  estimatedPreparedBytes += estimatedBytes;

  while (
    preparedImages.size > MAX_PREPARED_IMAGES ||
    estimatedPreparedBytes > MAX_PREPARED_IMAGE_BYTES
  ) {
    const oldest = preparedImages.entries().next().value;
    if (!oldest) return;

    estimatedPreparedBytes -= oldest[1].estimatedBytes;
    // 표시 중인 참조는 유지되도록 캐시 소유권만 제거하고 release하지 않습니다.
    preparedImages.delete(oldest[0]);
  }
}

export function getPreparedImage(uri: string, size: PreparedImageSize): ImageRef | undefined {
  const key = getImageKey(uri, normalizeSize(size));
  const entry = preparedImages.get(key);
  if (!entry) return undefined;

  preparedImages.delete(key);
  preparedImages.set(key, entry);
  return entry.image;
}

export function prepareImage(uri: string, size: PreparedImageSize): Promise<ImageRef> {
  let normalizedSize: PreparedImageSize;
  try {
    normalizedSize = normalizeSize(size);
  } catch (error) {
    return Promise.reject(error);
  }

  const key = getImageKey(uri, normalizedSize);
  const cachedImage = getPreparedImage(uri, normalizedSize);
  if (cachedImage) return Promise.resolve(cachedImage);

  const active = imagePreparations.get(key);
  if (active?.session === cacheSession) return active.promise;

  const session = cacheSession;
  const preparation: ImagePreparation = {
    session,
    promise: Promise.resolve()
      .then(async () => {
        assertCacheSession(session);
        const image = await prepareNativeImage(uri, normalizedSize, session);
        assertCacheSession(session);
        retainPreparedImage(key, image);
        return image;
      })
      .finally(() => {
        if (imagePreparations.get(key) === preparation) imagePreparations.delete(key);
      }),
  };
  imagePreparations.set(key, preparation);
  return preparation.promise;
}

export function getPreparedImageCacheSession() {
  return cacheSession;
}

export function resetPreparedImageCache() {
  cacheSession += 1;
  preparedImages.clear();
  imagePreparations.clear();
  uriPreparations.clear();
  estimatedPreparedBytes = 0;
}
