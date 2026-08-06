import { ApiError } from '@/src/shared/api/client';

type UploadImageToPresignedUrlParams = {
  contentType: string;
  imageUri: string;
  uploadUrl: string;
};

export async function uploadImageToPresignedUrl({
  contentType,
  imageUri,
  uploadUrl,
}: UploadImageToPresignedUrlParams) {
  const fileResponse = await fetch(imageUri);

  if (!fileResponse.ok) {
    throw new Error('업로드할 이미지 파일을 불러오지 못했습니다.');
  }

  const file = await fileResponse.blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const responseMessage = await uploadResponse.text().catch(() => '');

    throw new ApiError(
      responseMessage || '이미지를 업로드하지 못했습니다.',
      uploadResponse.status,
    );
  }
}
