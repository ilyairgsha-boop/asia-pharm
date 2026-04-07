/**
 * Russian pluralization helper for the word "балл" (point/score)
 * Rules:
 * - 1 балл (1 point)
 * - 2-4 балла (2-4 points)  
 * - 5+ баллов (5+ points)
 * - Exception: 11-14 баллов (always "баллов")
 */
export function pluralizePoints(count: number, language: string = 'ru'): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // Russian pluralization
  if (language === 'ru') {
    // Special case for 11-14
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return `${count} баллов`;
    }
    
    if (lastDigit === 1) {
      return `${count} балл`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return `${count} балла`;
    } else {
      return `${count} баллов`;
    }
  }

  // English pluralization
  if (language === 'en') {
    return count === 1 ? `${count} point` : `${count} points`;
  }

  // Chinese (积分 is both singular and plural)
  if (language === 'zh') {
    return `${count} 积分`;
  }

  // Vietnamese (điểm is both singular and plural)
  if (language === 'vi') {
    return `${count} điểm`;
  }

  // Default fallback
  return `${count} points`;
}