import { Box, Tooltip, Typography } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function PageTitle ({ subPage }: { subPage?: string }) {
  const MyNexus = 'My Nexus';
  const { account } = useWeb3React();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setUser] = useUser();
  const router = useRouter();

  return (
    <Typography
      variant='h1'
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        mb: 3,
        fontSize: {
          xs: '1.5em',
          sm: '2rem'
        }
      }}
    >
      {subPage ? (
        <Box component='span' alignItems='center'>
          <strong>{subPage}</strong>
        </Box>
      )
        : (
          <Box display='flex' justifyContent='space-between' width='100%' alignItems='center'>
            <strong>{MyNexus}</strong>
            <Tooltip arrow placement='top' title={account ? 'User cant be logged out so long as their wallet is connected' : ''}>
              <Box display='flex' justifyContent='flex-end' mt={2}>
                <Button
                  disabled={Boolean(account)}
                  variant='outlined'
                  color='secondary'
                  loading={isLoggingOut}
                  onClick={async () => {
                    setIsLoggingOut(true);
                    await charmClient.logout();
                    setUser(null);
                    router.push('/');
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Tooltip>
          </Box>
        ) }
    </Typography>
  );
}
