import { Button, List, ListItem, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

export function HowItWorksPage({ username }: { username: string }) {
  return (
    <SinglePageLayout>
      <InfoBackgroundImage />
      <SinglePageWrapper bgcolor='background.default'>
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
        <Button
          LinkComponent={Link}
          variant='contained'
          href='/'
          data-test='continue-button'
          sx={{ margin: '0 auto', display: 'flex', width: 'fit-content' }}
        >
          Play Scout Game
        </Button>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
