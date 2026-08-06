import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';

import { runRequestStep } from '@/src/shared/api/formatRequestError';
import { uploadImageToPresignedUrl } from '@/src/shared/api/uploadImageToPresignedUrl';
import { downloadRemoteImage } from '@/src/shared/lib/image/downloadRemoteImage';
import { removePhotoBackground } from '@/src/shared/lib/image/subjectSegmentation';

import { createCaptureApi } from '../api/createCaptureApi';
import { completeOriginalImageUploadApi } from '../api/completeOriginalImageUploadApi';
import { getCaptureGenerationApi } from '../api/getCaptureGenerationApi';
import {
  presignAnimalImageApi,
  type AnimalImagePresignResult,
} from '../api/presignAnimalImageApi';
import { submitCaptureGameResultApi } from '../api/submitCaptureGameResultApi';
import type {
  CaptureDetail,
  CaptureGameResult,
  CaptureThrowResult,
  CreateCaptureResult,
} from './types';

type CreateCaptureParams = {
  contentType: string;
  animalName: string;
  allowCoinPayment: boolean;
  photoUri: string;
};

const CAPTURE_POLL_INTERVAL_MS = 2000;

function waitForNextPoll() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, CAPTURE_POLL_INTERVAL_MS);
  });
}

export function useCreateCapture() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateCaptureResult | null>(null);
  const [animalImagePresign, setAnimalImagePresign] =
    useState<AnimalImagePresignResult | null>(null);
  const [captureDetail, setCaptureDetail] =
    useState<CaptureDetail | null>(null);
  const [gameResult, setGameResult] = useState<CaptureGameResult | null>(null);
  const capturePipelineRef = useRef<Promise<CreateCaptureResult> | null>(null);
  const pollingRunIdRef = useRef(0);

  useEffect(
    () => () => {
      pollingRunIdRef.current += 1;
    },
    [],
  );

  async function createCapture(params: CreateCaptureParams) {
    if (isLoading) {
      return false;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setAnimalImagePresign(null);
    setCaptureDetail(null);
    setGameResult(null);
    const { photoUri, ...request } = params;
    const capturePipeline = (async () => {
      const capture = await runRequestStep('POST /api/captures', () =>
        createCaptureApi({
          clientRequestId: Crypto.randomUUID(),
          ...request,
        }),
      );
      setResult(capture);
      await runRequestStep('PUT 원본 이미지 Presigned URL', () =>
        uploadImageToPresignedUrl({
          contentType: request.contentType,
          imageUri: photoUri,
          uploadUrl: capture.upload.url,
        }),
      );
      await runRequestStep(
        `POST /api/captures/${capture.captureId}/original-image/complete`,
        () => completeOriginalImageUploadApi(capture.captureId),
      );
      return capture;
    })();
    capturePipelineRef.current = capturePipeline;

    try {
      await capturePipeline;
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '포착 요청을 보내지 못했습니다.',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function submitGameResult(throws: CaptureThrowResult[]) {
    try {
      const capture = await capturePipelineRef.current;

      if (!capture) {
        throw new Error('포착 정보를 찾지 못했습니다.');
      }

      const submittedGameResult = await runRequestStep(
        `POST /api/captures/${capture.captureId}/game-result`,
        () => submitCaptureGameResultApi(capture.captureId, throws),
      );
      setGameResult(submittedGameResult);

      if (!throws.some(({ succeeded }) => succeeded)) {
        return true;
      }

      const pollingRunId = ++pollingRunIdRef.current;

      while (pollingRunIdRef.current === pollingRunId) {
        await waitForNextPoll();

        if (pollingRunIdRef.current !== pollingRunId) {
          return false;
        }

        const generation = await runRequestStep(
          `GET /api/captures/${capture.captureId}`,
          () => getCaptureGenerationApi(capture.captureId),
        );

        if (generation.generationStatus === 'SUCCEEDED') {
          if (!generation.cardImageUrl) {
            throw new Error('생성된 카드 이미지 주소가 없습니다.');
          }

          setCaptureDetail(generation as CaptureDetail);
          const cardImageUrl = generation.cardImageUrl;
          const cardImageUri = await runRequestStep(
            'GET cardImageUrl 이미지 다운로드',
            () => downloadRemoteImage(cardImageUrl),
          );
          const animalImageUri = await runRequestStep('누끼 제거 SDK', () =>
            removePhotoBackground(cardImageUri),
          );
          const presign = await runRequestStep(
            `POST /api/captures/${capture.captureId}/animal-image/presign`,
            () => presignAnimalImageApi(capture.captureId),
          );
          await runRequestStep('PUT 누끼 이미지 Presigned URL', () =>
            uploadImageToPresignedUrl({
              contentType: 'image/png',
              imageUri: animalImageUri,
              uploadUrl: presign.uploadUrl,
            }),
          );
          setAnimalImagePresign(presign);
          return true;
        }
      }

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '미니게임 결과를 전송하지 못했습니다.',
      );
      return false;
    }
  }

  return {
    clearError: () => setErrorMessage(null),
    animalImageKey: animalImagePresign?.key ?? null,
    captureDetail,
    createCapture,
    errorMessage,
    isLoading,
    gameResult,
    result,
    submitGameResult,
  };
}
