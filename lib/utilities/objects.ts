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
