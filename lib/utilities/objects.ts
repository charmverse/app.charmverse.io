import { pick, omit } from 'lodash';

export type FilterMode = 'include' | 'exclude';

export function filterObjectKeys<T, F extends FilterMode, K extends keyof T> (obj: T, mode: F, keys: K []): F extends 'include' ? Pick<T, K> : Omit<T, K> {

  if (mode === 'include') {
    return pick(obj, keys) as any;
  }
  else {
    return omit(obj as any, keys) as any;
  }
}

/**
 * Object.keys with inbuilt typing
 */
export function typedKeys<T> (obj: T): (keyof T)[] {
  return Object.keys(obj ?? {}) as (keyof T)[];
}
