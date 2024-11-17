import { Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function TalentProtocolPage() {
  return (
    <InfoPageContainer
      data-test='partner-talent-protocol-page'
      image='/images/info/rewards-partner-talent-protocol.jpg'
      title='Talent Protocol'
    >
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Talent Protocol is partnering with Scout Game to reward Talented Builders from a weekly pool of 7.5K $TALENT for
        season 1!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        The 5 top ranking Builders on Scout Game's weekly leaderboard with a Talent Score &gt; 75 will receive 1.5K
        $TALENT each that week.
      </Typography>
      <Typography>$TALENT is claimable via Talent Protocol.</Typography>
    </InfoCard>
  );
}
