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
