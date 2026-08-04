import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

type SubjectSegmentationNativeModule = {
  downloadModel(): Promise<boolean>;
  isModelAvailable(): Promise<boolean>;
  removeBackground(photoUri: string): Promise<string>;
};

const MODEL_DOWNLOAD_POLL_INTERVAL_MS = 1000;
const MODEL_DOWNLOAD_MAX_ATTEMPTS = 30;
const MODULE_DOWNLOAD_ERROR_PATTERN =
  /optional module|module.*download|waiting for.*module/i;

function waitForModelDownloadPoll() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, MODEL_DOWNLOAD_POLL_INTERVAL_MS);
  });
}

function isModuleDownloadingError(error: unknown) {
  return (
    error instanceof Error &&
    MODULE_DOWNLOAD_ERROR_PATTERN.test(error.message)
  );
}

async function waitForModelAvailability(
  module: SubjectSegmentationNativeModule,
) {
  for (
    let attempt = 0;
    attempt < MODEL_DOWNLOAD_MAX_ATTEMPTS;
    attempt += 1
  ) {
    await waitForModelDownloadPoll();

    if (await module.isModelAvailable()) {
      return;
    }
  }

  throw new Error(
    '누끼 제거 모델을 내려받지 못했습니다. 네트워크 연결을 확인해 주세요.',
  );
}

function getSubjectSegmentationModule() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    throw new Error('동물 배경 분리는 현재 Android와 iOS에서만 지원합니다.');
  }

  return requireNativeModule<SubjectSegmentationNativeModule>(
    'SubjectSegmentation',
  );
}

export async function isSubjectSegmentationModelAvailable() {
  return getSubjectSegmentationModule().isModelAvailable();
}

export async function downloadSubjectSegmentationModel() {
  if (Platform.OS !== 'android') {
    return;
  }

  const module = getSubjectSegmentationModule();
  await module.downloadModel();
  await waitForModelAvailability(module);
}

export async function removePhotoBackground(photoUri: string) {
  const module = getSubjectSegmentationModule();

  try {
    return await module.removeBackground(photoUri);
  } catch (error) {
    if (!isModuleDownloadingError(error)) {
      throw error;
    }

    await waitForModelAvailability(module);
    return module.removeBackground(photoUri);
  }
}
