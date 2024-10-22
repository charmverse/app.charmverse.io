import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function BountyCasterPage() {
  return (
    <InfoPageContainer
      data-test='partner-bountycaster-page'
      image='/images/info/rewards-partner-bountycaster.jpg'
      title='BountyCaster'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title=''>
      <Typography>Bountycaster is partnering with Scout Game to offer additional USDC rewards for builders!</Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Check Bountycaster for daily bounties from @ccarella.eth. Receive additional USDC rewards for being the first
        Builder to claim the bounty. Bounties will be paid by ccarella.eth via Bountycaster.
      </Typography>
    </InfoCard>
  );
}
