import { Typography } from '@mui/material';
import Image from 'next/image';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';

export function BountyCasterPage() {
  return (
    <DocumentPageContainer data-test='partner-bountycaster-page'>
      <Image
        src='/images/info/rewards-partner-bountycaster.jpg'
        width={854}
        height={285}
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
        alt='rewads partner bountycaster'
        priority={true}
      />
      <Document />
    </DocumentPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title='BountyCaster'>
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
