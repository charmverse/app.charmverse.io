'use client';

import { Button, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { JoinGithubButton } from '@packages/scoutgame-ui/components/common/JoinGithubButton';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import { useState } from 'react';

import { Dialog } from 'components/common/Dialog';

function InviteModal({ open, onClose, signedIn }: { open: boolean; onClose: () => void; signedIn: boolean }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <Stack
        gap={{
          xs: 1,
          md: 2
        }}
        m={{
          xs: 1,
          md: 2
        }}
      >
        <Typography variant='h6' color='secondary' textAlign='center'>
          Be a Scout Game Builder
        </Typography>

        <Stack>
          <Typography fontWeight={500} mb={1} color='secondary'>
            How it Works
          </Typography>
          <List
            sx={{ listStyleType: 'decimal', pl: 2, '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' } }}
          >
            <ListItem>
              <ListItemText primary='Scout Game creates Builder Cards to represent participating developers.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Builders compete in weekly contests by contributing to approved open source onchain projects.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Scouts show their support by purchasing Builder Cards. Builders and Scouts earn rewards based on the results of the weekly contest.' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Builders and Scouts earn rewards based on the results of the weekly contest.' />
            </ListItem>
          </List>
        </Stack>

        <Stack>
          <Typography fontWeight={500} mb={1} color='secondary'>
            Builder Benefits
          </Typography>
          <List
            sx={{ listStyleType: 'decimal', pl: 2, '& .MuiListItem-root': { py: 0.25, px: 0.5, display: 'list-item' } }}
          >
            <ListItem>
              <ListItemText primary='Receive a share of your Builder Card sales' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Earn Scout Points for contributing to approved projects' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Earn partner rewards from friendly ecosystems like Optimism' />
            </ListItem>
          </List>
        </Stack>
        <Divider sx={{ backgroundColor: 'secondary.main', width: '50%', mx: 'auto' }} />
        <Image src='/images/github-logo.png' width={120} height={30} alt='github' style={{ margin: '10px auto' }} />
        <Typography>
          {signedIn ? 'Apply to be a Builder by connecting your GitHub.' : 'Sign up / Sign in to apply.'}
        </Typography>
        {signedIn ? (
          <JoinGithubButton text='Apply' />
        ) : (
          <Button variant='contained' color='primary' href='/login'>
            Sign in
          </Button>
        )}
      </Stack>
    </Dialog>
  );
}

export function BuilderPageInviteCard() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const isDesktop = useMdScreen();

  if (user && user.builderStatus !== null) {
    return null;
  }

  return (
    <>
      <Paper
        sx={{
          p: {
            xs: 1,
            md: 3
          },
          my: {
            xs: 0.5,
            md: 1
          },
          display: 'flex',
          flexDirection: 'column',
          gap: {
            xs: 0.75,
            md: 2
          }
        }}
      >
        <Typography variant={isDesktop ? 'h5' : 'body1'} fontWeight={600} color='secondary' textAlign='center'>
          Are you a Developer?
        </Typography>
        <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400}>
          Do you regularly contribute to open source onchain repositories?
        </Typography>
        <Typography variant={isDesktop ? 'h6' : 'subtitle2'} fontWeight={400}>
          Scout Game rewards Builders for contributing to the onchain ecosystem.
        </Typography>

        <Typography
          variant={isDesktop ? 'h6' : 'subtitle2'}
          onClick={() => setOpen(true)}
          color='primary'
          sx={{ cursor: 'pointer', width: '100%', textAlign: 'center', fontWeight: 400 }}
        >
          Learn more
        </Typography>
      </Paper>
      <InviteModal open={open} onClose={() => setOpen(false)} signedIn={!!user} />
    </>
  );
}
