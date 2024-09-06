import { Typography, Button, Tooltip, Box } from '@mui/material';
import { redirect } from 'next/navigation';

import { getTier } from 'lib/scoring/constants';
import { getWaitlistSlotWithClicks } from 'lib/scoring/getWaitlistSlotWithClicks';
import { getSession } from 'lib/session/getSession';

export default async function ScorePage() {
  const session = await getSession();
  const waitlistSlot = await getWaitlistSlotWithClicks({ fid: parseInt(session.farcasterUser?.fid as string) }).catch(
    () => null
  );

  const hasRegisteredAsBuilder = !!waitlistSlot?.githubLogin;

  if (!waitlistSlot) {
    redirect('/join');
  }

  return (
    <div>
      <Typography variant='h3'>Score Page</Typography>

      <Typography variant='body1'>Tier: {getTier(waitlistSlot?.percentile as number)}</Typography>

      <Typography variant='body1'>Percentile: {waitlistSlot?.percentile}</Typography>

      <Typography variant='body1'>Clicks: {waitlistSlot?.clicks}</Typography>

      <Tooltip
        title={hasRegisteredAsBuilder ? `You've already signed up as a builder with @${waitlistSlot.githubLogin}` : ''}
      >
        <Box width='fit-content'>
          <Button href='/builders' disabled={!!waitlistSlot.githubLogin} variant='contained' color='primary'>
            Sign up as a Builder
          </Button>
        </Box>
      </Tooltip>
    </div>
  );
}
