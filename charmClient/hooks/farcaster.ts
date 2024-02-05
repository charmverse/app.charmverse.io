import type { Frame } from 'frames.js';

import { useGET } from './helpers';

export function useGetFarcasterFrame(frameUrl?: string) {
  return useGET<Frame | null>(frameUrl ? '/api/farcaster/get-frame' : null, { frameUrl });
}
