const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const SUPPORTED_CONTENT_TYPES = new Set(
  Object.values(CONTENT_TYPE_BY_EXTENSION),
);

type ImageFileInfo = {
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
};

export function getSupportedImageContentType({
  fileName,
  mimeType,
  uri,
}: ImageFileInfo) {
  if (mimeType) {
    const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();

    if (normalizedMimeType === 'image/jpg') {
      return 'image/jpeg';
    }

    return SUPPORTED_CONTENT_TYPES.has(normalizedMimeType)
      ? normalizedMimeType
      : null;
  }

  const filePath = (fileName ?? uri).split(/[?#]/)[0];
  const extension = filePath.split('.').pop()?.toLowerCase();

  return extension ? CONTENT_TYPE_BY_EXTENSION[extension] ?? null : null;
}
