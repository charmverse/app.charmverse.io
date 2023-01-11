import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

export default function PageTitle({ subPage }: { subPage?: string }) {
  const MyNexus = 'My Nexus';
  const { account, disconnectWallet } = useWeb3AuthSig();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { setUser, logoutUser } = useUser();
  const router = useRouter();

  async function logoutCurrentUser() {
    disconnectWallet();
    setIsLoggingOut(true);
    await logoutUser();
    router.push('/');
  }

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
      ) : (
        <Box display='flex' justifyContent='space-between' width='100%' alignItems='center'>
          <strong>{MyNexus}</strong>
          <Box display='flex' justifyContent='flex-end' mt={2}>
            <Button
              data-test='logout-button'
              variant='outlined'
              color='secondary'
              loading={isLoggingOut}
              onClick={logoutCurrentUser}
            >
              Logout
            </Button>
          </Box>
        </Box>
      )}
    </Typography>
  );
}
