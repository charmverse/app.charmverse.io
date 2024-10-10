import { log } from '@charmverse/core/log';

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function capitalize(input?: string): string {
  if (!input) {
    return '';
  }
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function prettyPrint(input: any): string {
  if (!input) {
    return '';
  }

  const pretty =
    typeof input === 'object'
      ? JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
      : input.toString
      ? input.toString()
      : input;

  log.info(pretty);

  return pretty;
}
