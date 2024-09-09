import { authSecret, baseUrl } from '@root/config/constants';
import type { FrameButton, FrameButtonLink } from 'frames.js';
import { sealData } from 'iron-session';

import type { SessionData } from 'lib/session/config';

export type WaitlistFramePage = 'join_waitlist_home' | 'join_waitlist_success' | 'waitlist_score';

type FarcasterUserToEncode = {
  fid: string | number;
  username: string;
  hasJoinedWaitlist?: boolean;
};

export async function embedFarcasterUser(data: FarcasterUserToEncode): Promise<`farcaster_user=${string}`> {
  const sealedFarcasterUser = await sealData({ farcasterUser: data } as SessionData, {
    password: authSecret as string
  });

  return `farcaster_user=${sealedFarcasterUser}`;
}

export const waitlistHomeJoinWaitlist: FrameButton = {
  label: 'Join waitlist',
  action: 'post'
};

export async function waitlistGetDetails({ fid, username }: FarcasterUserToEncode): Promise<FrameButtonLink> {
  return {
    label: 'Get details',
    action: 'link',
    target: `${baseUrl}/score?${await embedFarcasterUser({ fid, username })}`
  };
}

export async function waitlistGet10Clicks({ fid, username }: FarcasterUserToEncode): Promise<FrameButtonLink> {
  return {
    label: 'Get +10 clicks',
    action: 'link',
    target: `${baseUrl}/builders?${await embedFarcasterUser({ fid, username })}`
  };
}

export function shareFrameUrl(fid: string | number): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(
    'Join me on the waitlist for Scout Game! If you join via my frame, I earn points toward moving up in the list. No pressure, but you don’t want to miss this launch ;)'
  )}&embeds[]=${encodeURIComponent(`${baseUrl}/frame/${fid}`)}`;
}

export function waitlistShareMyFrame(fid: string | number): FrameButtonLink {
  return {
    label: 'Share & Earn Pts',
    action: 'link',
    target: shareFrameUrl(fid)
  };
}

export function waitlistShareAndLevelUp(fid: string | number): FrameButtonLink {
  return {
    label: 'Share & Level Up',
    action: 'link',
    target: shareFrameUrl(fid)
  };
}

export type WaitlistSearchParams = {
  current_page?: WaitlistFramePage;
  show_page?: WaitlistFramePage;
};

export type WaitlistFrameRequest = {
  params: {
    fid: string;
  };
  searchParams: WaitlistSearchParams;
};
