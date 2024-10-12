import { Typography } from '@mui/material';
import Image from 'next/image';

import { InfoCard } from 'components/common/DocumentPageContainer/components/InfoCard';
import { List, ListItem } from 'components/common/DocumentPageContainer/components/List';
import { DocumentPageContainer } from 'components/common/DocumentPageContainer/DocumentPageContainer';

export function Game7Page() {
  return (
    <DocumentPageContainer data-test='parther-game7-page'>
      <Image
        src='/images/info/rewards-partner-game7.jpg'
        width={854}
        height={285}
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
        alt='rewads partner game7'
        priority={true}
      />
      <Document />
    </DocumentPageContainer>
  );
}

function Document() {
  return (
    <InfoCard title='Game7'>
      <Typography>
        Game7 is partnering with Scout Game to support builders who contribute to the ecosystem. Game7 will distribute
        20 rewards of $250 each, from a prize pool of $5000 USD, to Builders!
      </Typography>
      <Typography variant='h6' color='secondary' mt={2}>
        How it works
      </Typography>
      <Typography>
        External builders will be rewarded $250 for merging a PR that addresses an Issue in one of the following GitHub
        Repos:
      </Typography>
      <List>
        <ListItem>https://github.com/G7DAO/protocol</ListItem>
        <ListItem>https://github.com/G7DAO/safes </ListItem>
        <ListItem>https://github.com/PermissionlessGames/degen-casino</ListItem>
        <ListItem>https://github.com/G7DAO/seer</ListItem>
      </List>
    </InfoCard>
  );
}
