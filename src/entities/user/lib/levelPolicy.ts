export const MAX_USER_LEVEL = 50;

export function getRequiredExpForNextLevel(currentLevel: number) {
  if (currentLevel >= MAX_USER_LEVEL) {
    return 0;
  }

  const normalizedLevel = Math.max(1, Math.floor(currentLevel));

  return 40 + 10 * (normalizedLevel - 1);
}

export function getRemainingExpForNextLevel(
  currentLevel: number,
  currentExp: number,
) {
  const requiredExp = getRequiredExpForNextLevel(currentLevel);

  if (requiredExp === 0) {
    return 0;
  }

  return Math.max(0, requiredExp - Math.max(0, currentExp));
}

export function getLevelProgress(
  currentLevel: number,
  currentExp: number,
) {
  const requiredExp = getRequiredExpForNextLevel(currentLevel);

  if (requiredExp === 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, currentExp) / requiredExp);
}
