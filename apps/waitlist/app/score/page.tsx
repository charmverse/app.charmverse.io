import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { getWaitlistSlotWithClicks } from 'lib/scoring/getWaitlistSlotWithClicks';
import { getSession } from 'lib/session/getSession';

export default async function ScorePage() {
  const session = await getSession();
  const waitlistSlot = await getWaitlistSlotWithClicks({ fid: parseInt(session.farcasterUser?.fid as string) }).catch(
    () => null
  );

  if (!waitlistSlot) {
    redirect('/join');
  }

  return (
    <div>
      <Typography variant='h3'>Score Page</Typography>

      <Typography variant='body1'>Percentile: {waitlistSlot?.percentile}</Typography>

      <Typography variant='body1'>Clicks: {waitlistSlot?.clicks}</Typography>
    </div>
  );
}
