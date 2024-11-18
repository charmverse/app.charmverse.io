import { Typography } from '@mui/material';

import { InfoCard } from '../common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from '../common/List';

import { InfoPageContainer } from './components/InfoPageContainer';

export function InfoPage() {
  return (
    <InfoPageContainer data-test='info-page' image='/images/info/info_banner.png' title='All about Scout Game!'>
      <Document />
    </InfoPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title='TL;DR'>
      <Typography>
        Think fantasy sports for open-source development. Collect builder NFTs, earn points when they merge Pull
        Requests in approved repositories, and win rewards. Some projects even offer additional crypto incentives.
      </Typography>
      <List>
        <ListItem>Anyone can scout a builder by buying NFTs representing that builder</ListItem>
        <ListItem>
          A builder can claim Scout Gems after performing Qualified Actions like a merged pull request in a Qualified
          GitHub Repository
        </ListItem>
        <ListItem>
          At the end of each week, Builders are ranked by the number of Gems they collect. Scout Points are allocated to
          the top-ranking Builders and the Scouts who hold their NFTs
        </ListItem>
        <ListItem>Scouts and Builders can claim Scout Points at the end of each week</ListItem>
        <ListItem>Scout Points are only claimable for the last and current seasons (3 months each)</ListItem>
      </List>
    </InfoCard>
  );
}
