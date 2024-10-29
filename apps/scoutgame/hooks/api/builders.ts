import type { BuilderSearchResult } from 'lib/builders/searchBuilders';

import { useGETImmutable } from './helpers';

export function useSearchBuilders(search: string) {
  return useGETImmutable<BuilderSearchResult[]>(search ? '/api/builders/search' : null, {
    search
  });
}
