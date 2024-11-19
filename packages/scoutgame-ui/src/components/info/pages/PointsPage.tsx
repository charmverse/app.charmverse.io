import { Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function PointsPage() {
  return (
    <InfoPageContainer data-test='points-page' image='/images/info/info_banner.png' title='Scout Points'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Scouts and Builders are rewarded in-game with Scout Points.</Typography>
      <Typography>
        Scout Points are claimable at the end of each week and remain claimable for only the current season and the next
        season.
      </Typography>
    </InfoCard>
  );
}
