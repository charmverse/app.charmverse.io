import { baseUrl } from '@root/config/constants';
import type { FrameButton, FrameButtonLink } from 'frames.js';

export type WaitlistFramePage = 'join_waitlist_home' | 'join_waitlist_success' | 'waitlist_score';

export const waitlistHomeJoinWaitlist: FrameButton = {
  label: 'Join waitlist',
  action: 'post'
};

export const waitlistGetDetails: FrameButtonLink = {
  label: 'Get details',
  action: 'link',
  target: 'https://charmverse.io/solutions/builders'
};

export const waitlistGet1000Points: FrameButtonLink = {
  label: 'Get +1000 points',
  action: 'link',
  target: 'https://connect.charmverse.io'
};

function shareFrameUrl(fid: string | number): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(
    'Join me on the waitlist for Charm Connect! If you join via my frame, I earn points toward moving up in the list. No pressure, but you don’t want to miss this launch ;)'
  )}&embeds[]=${encodeURIComponent(`${baseUrl}/waitlist/${fid}`)}`;
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
