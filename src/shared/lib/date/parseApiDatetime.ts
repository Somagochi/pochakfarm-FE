const TIMEZONE_SUFFIX_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export function parseApiDatetime(value: string) {
  const normalizedValue = TIMEZONE_SUFFIX_PATTERN.test(value)
    ? value
    : `${value}Z`;

  return Date.parse(normalizedValue);
}
