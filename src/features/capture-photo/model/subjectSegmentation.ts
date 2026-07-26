import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

type SubjectSegmentationNativeModule = {
  isModelAvailable(): Promise<boolean>;
  removeBackground(photoUri: string): Promise<string>;
};

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

export async function removePhotoBackground(photoUri: string) {
  return getSubjectSegmentationModule().removeBackground(photoUri);
}
