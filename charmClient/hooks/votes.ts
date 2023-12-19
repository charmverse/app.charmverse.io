import type { ExtendedVote } from 'lib/votes/interfaces';

import { useGET } from './helpers';

export function useGetVotesForPage(query?: { postId?: string; pageId?: string }) {
  return useGET<ExtendedVote[]>(query ? `/api/votes` : null, query, {
    revalidateOnFocus: false
  });
}
