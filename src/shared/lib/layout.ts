import { Dimensions } from 'react-native';

/**
 * 현재 UI가 제작된 기준 화면 너비입니다.
 * 모든 픽셀 기반 디자인 값은 이 너비 대비 비율로 환산합니다.
 */
export const REFERENCE_DEVICE_WIDTH = 411;

/**
 * 디자인 시안의 가로 값을 현재 디바이스 너비 비율에 맞춰 변환합니다.
 * 가로·세로에 같은 배율을 적용하면 이미지와 UI 요소의 종횡비가 유지됩니다.
 */
export function scaleByDeviceWidth(value: number) {
  return (
    value *
    (Dimensions.get('window').width / REFERENCE_DEVICE_WIDTH)
  );
}
