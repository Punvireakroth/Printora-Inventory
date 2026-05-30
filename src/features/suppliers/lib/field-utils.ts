export function emptyToNull (value: string | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}
