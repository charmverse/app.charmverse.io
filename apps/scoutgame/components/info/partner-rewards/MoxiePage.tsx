import { Typography } from '@mui/material';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/List';
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
        Moxie is partnering with Scout Game to reward Scouts for supporting Builders! Moxie will distribute 4.5M $Moxie
        to Scouts during Season 1!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        A Scout will earn 2000 $Moxie per Qualified Builder Card per week if all of the following conditions are met:
      </Typography>
      <List listStyleType='decimal'>
        <ListItem>They hold BOTH the Scout Game Builder NFT and the Moxie Fan token of the builder.</ListItem>
        <ListItem>The Builder scores at least 1 Scout Gem that week.</ListItem>
      </List>
      <Typography>$Moxie will be claimable via the Moxie Protocol.</Typography>
    </InfoCard>
  );
}
