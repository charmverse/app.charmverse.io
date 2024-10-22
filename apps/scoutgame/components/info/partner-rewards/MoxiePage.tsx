import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { InfoPageContainer } from 'components/info/components/InfoPageContainer';

export function MoxiePage() {
  return (
    <InfoPageContainer data-test='partner-moxie-page' image='/images/info/rewards-partner-moxie.jpg' title='Moxie'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
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
