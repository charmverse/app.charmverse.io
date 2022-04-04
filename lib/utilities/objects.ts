export type FilterMode = 'include' | 'exclude'

export function filterObjectKeys<T, F extends FilterMode, K extends keyof T> (obj: T, mode: F, keys: K []): F extends 'include' ? Pick<T, K> : Omit<T, K> {
  const objectEntries = Object.entries(obj);

  const reduced = objectEntries.reduce((newObj, entry) => {

    const key = entry[0] as K;

    let includeKey = false;

    if (mode === 'include' && keys.indexOf(key) >= 0) {
      includeKey = true;
    }
    else if (mode === 'exclude' && keys.indexOf(key) === -1) {
      includeKey = true;
    }

    if (includeKey === true) {
      newObj[key] = entry[1];
    }

    return newObj;
  }, <Partial<T>>{});

  return reduced as T;
}

const test = {
  firstKey: 1,
  secondKey: 2
};

filterObjectKeys(test, 'exclude', ['firstKey']);
