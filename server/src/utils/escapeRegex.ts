const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARS, '\\$&');
}
