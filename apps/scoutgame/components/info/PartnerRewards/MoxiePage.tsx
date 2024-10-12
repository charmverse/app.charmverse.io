import { Typography } from '@mui/material';
import Image from 'next/image';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';

export function MoxiePage() {
  return (
    <DocumentPageContainer data-test='parther-moxie-page'>
      <Image
        src='/images/info/rewards-partner-moxie.jpg'
        width={854}
        height={285}
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
        alt='rewads partner moxie'
        priority={true}
      />
      <Document />
    </DocumentPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title='Moxie'>
      <Typography>
        Moxie is partnering with Scout Game to reward Scouts for supporting Builders! Moxie will distribute 2M $Moxie to
        Scouts during Season 1!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        Scouts will earn Moxie if they scout a Builder with a Moxie Fan Token. A Scout must hold BOTH the Scout Game
        Builder NFT and the Moxie Fan token of the builder.
      </Typography>
      <Typography>$Moxie will be claimable via the Moxie Protocol.</Typography>
    </InfoCard>
  );
}
