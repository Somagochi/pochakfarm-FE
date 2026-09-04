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

const HEIC_CONTENT_TYPES = new Set(['image/heic', 'image/heif']);
const HEIC_EXTENSIONS = new Set(['heic', 'heif']);

function getFileExtension({ fileName, uri }: ImageFileInfo) {
  const filePath = (fileName ?? uri).split(/[?#]/)[0];

  return filePath.split('.').pop()?.toLowerCase() ?? null;
}

export function isHeicImageFile(imageFile: ImageFileInfo) {
  const normalizedMimeType = imageFile.mimeType
    ?.toLowerCase()
    .split(';')[0]
    .trim();

  return (
    (normalizedMimeType ? HEIC_CONTENT_TYPES.has(normalizedMimeType) : false) ||
    HEIC_EXTENSIONS.has(getFileExtension(imageFile) ?? '')
  );
}

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

  const extension = getFileExtension({ fileName, mimeType, uri });

  return extension ? CONTENT_TYPE_BY_EXTENSION[extension] ?? null : null;
}
