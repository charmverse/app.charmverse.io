'use client';

import { Button, List, ListItem, ListItemAvatar, Stack, Typography } from '@mui/material';
import { PointsIcon } from '@packages/scoutgame-ui/components/common/Icons';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Link from 'next/link';
import React from 'react';

export function HowItWorksContent({ onClickContinue }: { onClickContinue?: React.MouseEventHandler }) {
  const isMdScreen = useMdScreen();
  const iconSize = isMdScreen ? 24 : 18;
  return (
    <>
      <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
        Scout Game in a Nutshell
      </Typography>
      <List sx={{ mb: 2 }}>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <img src='/images/number_icon_1.png' alt='1' />
          </ListItemAvatar>
          <Typography fontSize={{ xs: '13px', sm: '1rem' }}>
            <strong>Discover builders who are contributing to cool onchain projects.</strong> Choose from the Hot
            Builders section or explore the Scout page to find hidden gems.
          </Typography>
        </ListItem>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <img src='/images/number_icon_2.png' alt='2' />
          </ListItemAvatar>
          <Stack display='flex' gap={2}>
            <Typography fontSize={{ xs: '13px', sm: '1rem' }}>
              <strong>
                Scout them by buying their Builder Cards with{' '}
                <Typography
                  component='span'
                  color='secondary'
                  fontSize='inherit'
                  fontWeight='inherit'
                  style={{ display: 'inline-flex', gap: 4 }}
                >
                  points <PointsIcon color='blue' size={iconSize} />
                </Typography>
              </strong>{' '}
              or <strong>ETH / USDC</strong> on
            </Typography>
          </Stack>
        </ListItem>
        <Stack flexDirection='row' gap={2} width='100%' justifyContent='center' my={2}>
          <img src='/images/crypto/ethereum-circle.png' alt='Ethereum' title='Ethereum' width='24' height='24' />
          <img src='/images/crypto/op.png' alt='OP' title='Optimism' width='24' height='24' />
          <img src='/images/crypto/arbitrum.png' alt='Arbitrum' title='Arbitrum' width='24' height='24' />
          <img src='/images/crypto/base64.png' alt='Base' title='Base' width='24' height='24' />
          <img src='/images/crypto/zora64.png' alt='Zora' title='Zora' width='24' height='24' />
        </Stack>
        <ListItem sx={{ px: 1, alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <img src='/images/number_icon_3.png' alt='3' />
          </ListItemAvatar>
          <Typography fontSize={{ xs: '13px', sm: '1rem' }}>
            <strong>
              Watch your{' '}
              <Typography
                component='span'
                color='secondary'
                fontSize='inherit'
                fontWeight='inherit'
                style={{ display: 'inline-flex', gap: 4 }}
              >
                points <PointsIcon color='blue' size={iconSize} />
              </Typography>
              {'  '}
              increase
            </strong>{' '}
            as your builders climb the weekly Leaderboard. The more they code, the higher you go!
          </Typography>
        </ListItem>
      </List>
      <Button
        LinkComponent={Link}
        variant='contained'
        onClick={onClickContinue}
        href='/welcome/scout-info'
        data-test='continue-button'
        sx={{ margin: '0 auto', display: 'flex', width: 'fit-content' }}
      >
        Next
      </Button>
    </>
  );
}
