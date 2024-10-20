import type { RepoSearchResult } from '../../app/api/github/search-repos/route';

import { useGET } from './helpers';

export function useGetScoutEvents(scoutId: string) {
  return useGET<RepoSearchResult[]>(scoutId ? '/api/onchain/scout-events' : null, { scoutId });
}

export function useGetTransactionStatus({ chainId, txHash }: { chainId: string; txHash: string }) {
  return useGET<RepoSearchResult[]>(chainId && txHash ? '/api/onchain/transaction-status' : null, { chainId, txHash });
}
