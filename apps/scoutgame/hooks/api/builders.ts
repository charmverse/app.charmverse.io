import { useGETImmutable, usePUT } from '@packages/scoutgame-ui/hooks/helpers';

import type { BuilderSearchResult } from 'lib/builders/searchBuilders';

export function useSearchBuilders(search: string) {
  return useGETImmutable<BuilderSearchResult[]>(search ? '/api/builders/search' : null, {
    search
  });
}

export function useRefreshCongratsImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}
