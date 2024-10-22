import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function AboutPage() {
  return (
    <InfoPageContainer data-test='about-page' image='/images/info/info_banner.png' title='What is Scout Game?'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Here's your new mission: Become a Scout and hunt for the next big onchain builders.</Typography>
      <Typography>
        Your role? Spot them early and help them rise to the top. As they climb to success, you rake in rewards for
        backing the right talent.
      </Typography>
      <Typography>
        Forget gambling. This is about growth. Back real talent, watch them thrive, and share in the success.
      </Typography>
      <Typography>
        The Scout Game is designed to reward individuals for identifying and supporting emerging developer talent within
        onchain ecosystems. As a Scout, your goal is to recognize promising builders early in their journey and help
        them gain visibility. In return, you earn rewards based on their success.
      </Typography>
    </InfoCard>
  );
}
