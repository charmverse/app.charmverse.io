import { Button, List, ListItem, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

export function HowItWorksPage({ username }: { username: string }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Typography variant='h5' color='secondary' mb={2}>
          Welcome {username}
        </Typography>
        <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h4'>
          Scout Game in a Nutshell
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 2 }}>
          <ListItem sx={{ display: 'list-item', p: 1 }}>
            Find builders who are contributing code to Approved Projects. Choose from Hot Builders or browse builders on
            the Scout page
          </ListItem>
          <ListItem sx={{ display: 'list-item', p: 1 }}>Scout them by buying their Builder NFT</ListItem>
          <ListItem sx={{ display: 'list-item', p: 1 }}>Earn points as they:</ListItem>
          <List sx={{ listStyle: 'disc', pl: 2 }}>
            <ListItem sx={{ display: 'list-item', p: 1, pb: 0 }}>
              Contribute code (Pull Request(PR) accepted and merged)
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 1, pb: 0 }}>
              Contribute to an Approved Project for the 1st time
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 1, pb: 0 }}>
              Complete code contribution streaks(3 PRs merged to an Approved Project within 7 days)
            </ListItem>
            <ListItem sx={{ display: 'list-item', p: 1, pb: 0 }}>Win Grants</ListItem>
          </List>
        </List>
        <Stack justifyContent='center' alignItems='center' width='100%'>
          <Image src='/images/purple_binoculars.png' alt='purple binoculars' width={150} height={150} />
        </Stack>
        <Button fullWidth href='/' data-test='continue-button'>
          Play Scout Game
        </Button>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
