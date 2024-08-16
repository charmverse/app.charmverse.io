import { baseUrl } from '@root/config/constants';

import type { WaitlistFramePage } from 'lib/waitlist/actionButtons';

export function getWaitlistPostbackUrl({
  currentPage,
  referrerFid
}: {
  currentPage: WaitlistFramePage;
  referrerFid: string | number;
}) {
  return `${baseUrl}/api/waitlist?current_page=${currentPage}&referrer_fid=${referrerFid}`;
}

export function getWaitlistLevelsPostbackUrl({ currentPage }: { currentPage: WaitlistFramePage }) {
  return `${baseUrl}/api/waitlist/levels?current_page=${currentPage}`;
}
