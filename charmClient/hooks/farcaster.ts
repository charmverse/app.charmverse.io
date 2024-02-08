import type { Frame } from 'frames.js';

import type { FrameActionRequest, FrameActionResponse } from 'pages/api/farcaster/frame-action';
import type { FarcasterSignerResponse } from 'pages/api/farcaster/signer';

import { useGET, usePOST } from './helpers';

export function useGetFarcasterFrame(query?: { frameUrl: string; pageId?: string }) {
  return useGET<Frame | null>(query ? '/api/farcaster/frame' : null, query, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });
}

export function useFarcasterFrameAction() {
  return usePOST<FrameActionRequest, FrameActionResponse>('/api/farcaster/frame-action');
}

export function useCreateFarcasterSigner() {
  return usePOST<
    {
      publicKey: `0x${string}`;
    },
    FarcasterSignerResponse
  >('/api/farcaster/signer');
}
