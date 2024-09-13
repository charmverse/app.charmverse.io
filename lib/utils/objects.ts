import { pick, omit } from 'lodash-es';

export type FilterMode = 'include' | 'exclude';

export function filterObjectKeys<T, F extends FilterMode, K extends keyof T>(
  obj: T,
  mode: F,
  keys: K[]
): F extends 'include' ? Pick<T, K> : Omit<T, K> {
  if (mode === 'include') {
    return pick(obj, keys) as any;
  } else {
    return omit(obj as any, keys) as any;
  }
}

/**
 * Object.keys with inbuilt typing
 */
export function typedKeys<T>(obj: T): (keyof T)[] {
  return Object.keys(obj ?? {}) as (keyof T)[];
}

// Mark fields that we dont need to send to the frotnend (booleans, nulls and empty strings) as optional
export type OptionalFalseyFields<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K] | undefined
    : T[K] extends boolean
    ? T[K] | undefined
    : null extends T[K]
    ? T[K] | undefined
    : T[K];
};

// mutative method
export function removeFalseyFields<T extends object, U extends keyof T>(obj: T): OptionalFalseyFields<T> {
  const result = obj as OptionalFalseyFields<T>;
  for (const [key, value] of Object.entries(result)) {
    if (value === null || obj[key as keyof T] === '') {
      delete result[key as keyof T];
    }
  }
  return result;
}
