import { pick, omit } from 'lodash';

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

// mutative method, an optimizer to reduce the size of the payload when returning pages or blocks
// One issue with the types is that we can't infer if a string value will be empty or not, so we have to make it optional
// This breaks fields like "id" which always have a value
// See BlockWithDetails for an example of how to use this
export function removeFalseyFields<T extends object>(obj: T): OptionalFalseyFields<T> {
  const result = obj as OptionalFalseyFields<T>;
  for (const [key, value] of Object.entries(result)) {
    if (value === null || obj[key as keyof T] === '') {
      delete obj[key as keyof T];
    }
  }
  return obj;
}
