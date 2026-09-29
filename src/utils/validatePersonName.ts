export const PERSON_NAME_ERROR = 'Enter your first and last name using letters only.';

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidPersonName(value: string): boolean {
  const name = normalizePersonName(value);

  if (name.length < 3 || name.length > 255) {
    return false;
  }

  if (/\d/.test(name) || name.includes('@')) {
    return false;
  }

  const parts = name.split(' ');
  if (parts.length < 2) {
    return false;
  }

  const partPattern = /^[\p{L}]+(?:['’\-][\p{L}]+)*\.?$/u;
  const initialPattern = /^[\p{L}]\.?$/u;
  let hasFullWord = false;

  for (const part of parts) {
    if (initialPattern.test(part)) {
      continue;
    }
    const letterCount = (part.match(/\p{L}/gu) ?? []).length;
    if (partPattern.test(part) && letterCount >= 2) {
      hasFullWord = true;
      continue;
    }
    return false;
  }

  return hasFullWord;
}
