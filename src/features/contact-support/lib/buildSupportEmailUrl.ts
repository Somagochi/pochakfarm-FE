import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SUPPORT_EMAIL = 'somagochi2026@gmail.com';

function getOsInformation() {
  if (Platform.OS === 'android') {
    return `Android ${Platform.constants.Release}`;
  }

  if (Platform.OS === 'ios') {
    return `${Platform.constants.systemName} ${Platform.constants.osVersion}`;
  }

  return `${Platform.OS} ${String(Platform.Version)}`;
}

function getDeviceInformation() {
  if (Platform.OS === 'android') {
    return `${Platform.constants.Brand} ${Platform.constants.Model}`;
  }

  if (Platform.OS === 'ios') {
    return Constants.platform?.ios?.model ?? Constants.deviceName ?? '확인 불가';
  }

  return Constants.deviceName ?? '확인 불가';
}

export function buildSupportEmailUrl(nickname: string | null | undefined) {
  const subject = '[포착팜] 문의드립니다';
  const body = [
    '문의 내용을 작성해주세요.',
    '',
    '',
    '------------------------------',
    '아래 정보는 문의 해결을 위해 자동으로 입력됩니다.',
    `닉네임: ${nickname || '확인 불가'}`,
    `OS: ${getOsInformation()}`,
    `앱 버전: ${Constants.expoConfig?.version ?? '확인 불가'}`,
    `디바이스: ${getDeviceInformation()}`,
  ].join('\n');

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
