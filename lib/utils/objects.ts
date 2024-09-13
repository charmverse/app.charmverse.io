export type FilterMode = 'include' | 'exclude';

export function filterObjectKeys<T, F extends FilterMode, K extends keyof T>(
  obj: T,
  mode: F,
  keys: K[]
): F extends 'include' ? Pick<T, K> : Omit<T, K> {
  if (mode === 'include') {
    return pick(obj as any, keys) as any;
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

// the following methods were copied from lodash to avoid dealing with es imports

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;

  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
}

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj } as Omit<T, K>;

  keys.forEach((key) => {
    if (key in result) {
      delete (result as T)[key];
    }
  });

  return result;
}

export function sortBy<T>(array: T[], iteratees: (string | keyof T | ((item: T) => any))[]): T[] {
  return [...array].sort((a, b) => {
    for (const iteratee of iteratees) {
      let aValue: any;
      let bValue: any;

      // If iteratee is a function, invoke it to get the value
      if (typeof iteratee === 'function') {
        aValue = iteratee(a);
        bValue = iteratee(b);
      } else {
        // If iteratee is a key, use it to access the object's property
        aValue = a[iteratee as keyof T];
        bValue = b[iteratee as keyof T];
      }

      if (aValue > bValue) return 1;
      if (aValue < bValue) return -1;
    }
    return 0;
  });
}
