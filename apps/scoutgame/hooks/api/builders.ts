import type { BuilderSearchResult } from 'lib/builders/searchBuilders';

import { useGETImmutable } from './helpers';

export function useSearchBuilders(username: string) {
  return useGETImmutable<BuilderSearchResult[]>(username ? '/api/builders/search' : null, {
    username
  });
}
