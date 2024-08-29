export function assertNotUndefined<T>(value: T | undefined, message: string): asserts value is T {
  if (value === undefined) {
    throw new Error(`assertion failed: ${message}`);
  }
}

/**
 * Creates an object from an array of [key, Value], filtering out any
 * undefined or null key
 */
export function createObject<T>(entries: [string | null | undefined, T][]): {
  [k: string]: T;
} {
  return Object.fromEntries(entries.filter((e) => e[0] != null));
}
