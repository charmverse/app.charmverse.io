export type FilterMode = 'include' | 'exclude';

/**
 * Object.keys with inbuilt typing
 */
export function typedKeys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj ?? {}) as (keyof T)[];
}
