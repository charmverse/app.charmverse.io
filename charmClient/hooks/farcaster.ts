import type { Frame } from 'frames.js';

import { useGET } from './helpers';

export function useGetFarcasterFrame(query?: { frameUrl: string; pageId?: string }) {
  return useGET<Frame | null>(query ? '/api/farcaster/frame' : null, query, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });
}
