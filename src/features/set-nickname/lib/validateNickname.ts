const INCOMPLETE_HANGUL_PATTERN = /[\u1100-\u11ff\u3131-\u318e\ua960-\ua97f\ud7b0-\ud7ff]/;

export function hasValidNicknameLength(nickname: string) {
  return nickname.length >= 1 && nickname.length <= 6;
}

export function isUsableNickname(nickname: string) {
  return (
    hasValidNicknameLength(nickname) &&
    nickname.trim().length > 0 &&
    !INCOMPLETE_HANGUL_PATTERN.test(nickname)
  );
}
