import { baseUrl } from '@root/config/constants';

import type { WaitlistFramePage } from 'lib/frame/actionButtons';

export function getWaitlistPostbackUrl({
  currentPage,
  referrerFid
}: {
  currentPage: WaitlistFramePage;
  referrerFid: string | number;
}) {
  return `${baseUrl}/api/waitlist?current_page=${currentPage}&referrer_fid=${referrerFid}`;
}
