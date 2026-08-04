import { ApiError } from '@/src/shared/api/client';

type UploadCaptureImageParams = {
  contentType: string;
  photoUri: string;
  uploadUrl: string;
};

export async function uploadCaptureImageApi({
  contentType,
  photoUri,
  uploadUrl,
}: UploadCaptureImageParams) {
  const fileResponse = await fetch(photoUri);

  if (!fileResponse.ok) {
    throw new Error('업로드할 사진 파일을 불러오지 못했습니다.');
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
      responseMessage || '사진을 업로드하지 못했습니다.',
      uploadResponse.status,
    );
  }
}
