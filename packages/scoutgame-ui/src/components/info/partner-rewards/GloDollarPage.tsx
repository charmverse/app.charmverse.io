import { Link, Typography } from '@mui/material';

import { InfoCard } from '../../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../../common/List';
import { InfoPageContainer } from '../components/InfoPageContainer';

export function GloDollarPage() {
  return (
    <InfoPageContainer data-test='partner-glo-page' image='/images/info/rewards-partner-glo.png' title='Glo Dollar'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>
        Glo Dollar is rewarding Scouts for supporting Builders! The total prize pool is $1000 USDGLO through December
        2024.
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        A Scout receives $1 USDGLO for each Builder Card, up to 5, purchased through the end of the year. Maximum reward
        per Scout is $5 USDGLO.
      </Typography>
    </InfoCard>
  );
}
