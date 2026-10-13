export type CaptureThrowGeometry = {
  screenWidth: number;
  frameCenterY: number;
  targetCenterY: number;
  minimumDistance: number;
  idealDistance: number;
  horizontalVelocityDistance: number;
};

export function calculateCaptureThrow(
  dx: number,
  dy: number,
  vx: number,
  vy: number,
  geometry: CaptureThrowGeometry,
) {
  'worklet';
  // 속도 단위는 기존 PanResponder와 동일한 point/ms입니다.
  const valid = dy <= -geometry.minimumDistance && vy <= -0.18;
  const power = Math.max(0.35, Math.min(1.65,
    Math.abs(dy) / geometry.idealDistance * 0.65 + Math.abs(vy) * 0.35,
  ));
  const destinationX = Math.max(-geometry.screenWidth * 0.42, Math.min(
    geometry.screenWidth * 0.42, dx * 1.35 + vx * geometry.horizontalVelocityDistance,
  ));
  const destinationY = -(geometry.frameCenterY - geometry.targetCenterY) * power;
  return {
    valid,
    destinationX,
    destinationY,
    landingDistance: Math.hypot(destinationX, geometry.frameCenterY + destinationY - geometry.targetCenterY),
    durationMs: Math.max(320, Math.min(720, 760 - power * 240)),
    rotation: vx < 0 ? -360 : 360,
  };
}

export function judgeCaptureLanding(ringScale: number, distance: number, successDistance: number) {
  'worklet';
  const isPositionMatched = distance <= successDistance;
  const isTimingMatched = ringScale <= 0.38;
  return { isPositionMatched, isTimingMatched, succeeded: isPositionMatched && isTimingMatched };
}
