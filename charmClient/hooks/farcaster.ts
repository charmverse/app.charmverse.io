import type { StatusAPIResponse as FarcasterPayload } from '@farcaster/auth-kit';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { Frame } from 'frames.js';

import type { FrameActionRequest, FrameActionResponse } from 'pages/api/farcaster/frame-action';
import type { FarcasterSignerResponse } from 'pages/api/farcaster/signer';

import { useDELETE, useGET, usePOST } from './helpers';

export function useGetFarcasterFrame(query?: { frameUrl: string; pageId?: string }) {
  return useGET<Frame | Partial<Frame> | null>(query ? '/api/farcaster/frame' : null, query, {
    revalidateOnFocus: false,
    shouldRetryOnError: false
  });
}

export function useFarcasterFrameAction() {
  return usePOST<FrameActionRequest, FrameActionResponse>('/api/farcaster/frame-action');
}

export function useCreateFarcasterSigner() {
  return usePOST<{ publicKey: `0x${string}` } | undefined, FarcasterSignerResponse>('/api/farcaster/signer');
}

export function useFarcasterLogin() {
  return usePOST<FarcasterPayload, LoggedInUser | { otpRequired: true }>('/api/farcaster/login');
}

export function useFarcasterConnect() {
  return usePOST<FarcasterPayload, LoggedInUser>('/api/farcaster/connect');
}

export function useFarcasterDisconnect() {
  return useDELETE<undefined>('/api/farcaster/connect');
}
