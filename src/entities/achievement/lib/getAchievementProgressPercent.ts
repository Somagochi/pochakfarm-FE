export function getAchievementProgressPercent(
  current: number,
  target: number,
) {
  if (current >= target) {
    return 100;
  }

  if (target <= 0) {
    return 0;
  }

  const progress = Math.floor((current / target) * 10) * 10;

  return Math.min(100, Math.max(0, progress));
}
