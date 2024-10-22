import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';

import { InfoPageContainer } from '../components/InfoPageContainer';

export function ScoutsPage() {
  return (
    <InfoPageContainer data-test='scouts-page' image='/images/info/info_banner.png' title='How it works for Scouts'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard>
      <Typography>Step into the shoes of an onchain Scout.</Typography>
      <Typography>
        Scouts participate by collecting NFTs associated with top builders during each season. As these builders
        excel—by contributing to codebases—Scouts accumulate points. The more successful your chosen builders, the more
        points you earn.
      </Typography>
      <Typography>
        By accumulating Scout Points, you can exchange them to scout even more builders, boosting your standing within
        the game and increasing your potential rewards.
      </Typography>
      <div>
        <Typography variant='h6' color='secondary' mt={2}>
          Key Scout Actions:
        </Typography>
        <List>
          <ListItem>Collect NFTs from top builders every season.</ListItem>
          <ListItem>Earn Scout Points when the builders you back succeed in open-source contributions.</ListItem>
        </List>
      </div>
    </InfoCard>
  );
}
