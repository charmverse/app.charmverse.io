'use client';

import { Button, List, ListItem, Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';

export function HowItWorksContent({ onClickContinue }: { onClickContinue?: React.MouseEventHandler }) {
  return (
    <>
      <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
        Welcome to the Scout Game Bot 🚀
      </Typography>
      <Typography>
        Welcome to the fantasy league of onchain talent! Scout, score, and climb to the top of the leaderboard. Ready to
        play?
      </Typography>
      <List sx={{ mb: 2 }}>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <Typography>
            🎉 Claim your daily points with just a tap. Keep the streak going to unlock even more rewards!
          </Typography>
        </ListItem>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <Typography>
            👥 Bring friends into the game and earn points for every successful invite! The more you grow the network,
            the higher you climb on the leaderboard.
          </Typography>
        </ListItem>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <Typography>
            🔥 Join challenges, participate in quests, and engage with other scouts for extra points and exclusive
            bonuses.New features are coming soon! Keep an eye out for fresh ways to earn with the Scout Game.
          </Typography>
        </ListItem>
      </List>
      <Button
        LinkComponent={Link}
        variant='contained'
        onClick={onClickContinue}
        href='/quests'
        data-test='continue-button'
        sx={{ margin: '0 auto', display: 'flex', width: 'fit-content' }}
      >
        Start Playing
      </Button>
    </>
  );
}
