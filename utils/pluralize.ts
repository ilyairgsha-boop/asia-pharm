/**
 * Russian pluralization helper for the word "балл" (point/score)
 * Rules:
 * - 1 балл (1 point)
 * - 2-4 балла (2-4 points)  
 * - 5+ баллов (5+ points)
 * - Exception: 11-14 баллов (always "баллов")
 */
export function pluralizePoints(count: number, language: string = 'ru'): string {
  // Only apply Russian rules for Russian language
  if (language !== 'ru') {
    return count === 1 ? 'point' : 'points';
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // Special case for 11-14
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} баллов`;
  }

  // 1 балл
  if (lastDigit === 1) {
    return `${count} балл`;
  }

  // 2-4 балла
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} балла`;
  }

  // 5-0, 5+ баллов
  return `${count} баллов`;
}

/**
 * Get just the word form without the number
 */
export function getPointsWord(count: number, language: string = 'ru'): string {
  if (language !== 'ru') {
    return count === 1 ? 'point' : 'points';
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'баллов';
  }

  if (lastDigit === 1) {
    return 'балл';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'балла';
  }

  return 'баллов';
}
