import { apiClient } from '@/src/shared/api/client';

export type AnimalImagePresignResult = {
  uploadUrl: string;
  key: string;
  expiresAt: string;
};

type AnimalImagePresignResponse = {
  data: AnimalImagePresignResult;
};

export async function presignAnimalImageApi(captureId: number) {
  const response = await apiClient.postWithoutBody<AnimalImagePresignResponse>(
    `/api/captures/${captureId}/animal-image/presign`,
  );

  return response.data;
}
