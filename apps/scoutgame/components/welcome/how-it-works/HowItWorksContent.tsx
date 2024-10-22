'use client';

import { Button, List, ListItem, ListItemAvatar, Stack, Typography, styled } from '@mui/material';
import Link from 'next/link';

// make a styled icon with a number and circle border that uses primary color
const StyledIcon = styled('div')`
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.secondary.main};
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.palette.secondary.main};
`;

export function HowItWorksContent() {
  return (
    <>
      <Typography color='secondary' textAlign='center' width='100%' fontWeight={700} variant='h5'>
        Scout Game in a Nutshell
      </Typography>
      <List sx={{ mb: 2 }}>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <StyledIcon>1</StyledIcon>
          </ListItemAvatar>
          <Typography fontSize='1.1rem'>
            <strong>Discover builders who are contributing to cool onchain projects.</strong> Choose from the Hot
            Builders section or explore the Scout page to find hidden gems.
          </Typography>
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <StyledIcon>2</StyledIcon>
          </ListItemAvatar>
          <Stack display='flex' gap={2}>
            <Typography fontSize='1.1rem'>
              <strong>Scout them by buying their Builder Cards with points</strong> or <strong>ETH / USDC</strong> on
            </Typography>
            <Stack flexDirection='row' gap={2} width='100%' justifyContent='center'>
              <img src='/images/crypto/ethereum-circle.png' alt='Ethereum' title='Ethereum' width='24' height='24' />
              <img src='/images/crypto/op64.png' alt='OP' title='Optimism' width='24' height='24' />
              <img src='/images/crypto/arbitrum.png' alt='Arbitrum' title='Arbitrum' width='24' height='24' />
              <img src='/images/crypto/base64.png' alt='Base' title='Base' width='24' height='24' />
              <img src='/images/crypto/zora64.png' alt='Zora' title='Zora' width='24' height='24' />
            </Stack>
          </Stack>
        </ListItem>
        <ListItem sx={{ alignItems: 'flex-start' }}>
          <ListItemAvatar>
            <StyledIcon>3</StyledIcon>
          </ListItemAvatar>
          <Typography fontSize='1.1rem'>
            <strong>Watch your points increase</strong> as your builders climb the weekly Leaderboard. The more they
            code, the higher you go!
          </Typography>
        </ListItem>
      </List>
      <Button
        LinkComponent={Link}
        variant='contained'
        href='/'
        data-test='continue-button'
        sx={{ margin: '0 auto', display: 'flex', width: 'fit-content' }}
      >
        Start Playing
      </Button>
    </>
  );
}
