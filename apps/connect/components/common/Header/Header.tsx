'use client';

import { log } from '@charmverse/core/log';
import { useDarkTheme } from '@connect-shared/hooks/useDarkTheme';
import { usePageView } from '@connect-shared/hooks/usePageView';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar } from '@mui/material';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';
import { ConnectApiClient } from 'apiClient/apiClient';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { Avatar } from 'components/common/Avatar';

import { InstallAppMenuItem } from './components/InstallAppMenuItem';

export function Header({ user }: { user: LoggedInUser | null }) {
  const path = usePathname();
  const router = useRouter();
  useDarkTheme();
  usePageView();
  useDatadogLogger({ service: 'connect-browser', userId: user?.id });

  const farcasterDetails = user?.farcasterUser?.account as Required<FarcasterBody> | undefined;

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    const connectApiClient = new ConnectApiClient();
    await connectApiClient.logout().catch((error) => {
      log.error('There was an error while trying to signout', { error });
    });
    log.info('User logged out');
    revalidatePathAction();
    router.push('/');
  };

  return (
    <AppBar
      position='static'
      sx={{
        backgroundColor: path === '/' ? 'background.default' : { xs: 'background.default', md: 'mainBackground.main' },
        boxShadow: 'none',
        pt: 1
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }} variant='dense'>
          <Link href='/'>
            <Image src='/images/cv-connect-logo.png' width={40} height={40} alt='Connect logo' />
          </Link>
          {user && (
            <Box display='flex' gap={1} alignItems='center'>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  src={farcasterDetails?.pfpUrl || user?.avatar || undefined}
                  size='medium'
                  name={user?.username}
                />
              </IconButton>
              <Menu
                sx={{ mt: 5 }}
                id='menu-appbar'
                slotProps={{
                  paper: { sx: { '.MuiList-root': { pb: 0 }, maxWidth: '250px' } }
                }}
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                onClick={handleCloseUserMenu}
              >
                <MenuItem>
                  <Link href='/profile'>@{farcasterDetails?.username}</Link>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
                <InstallAppMenuItem>Install</InstallAppMenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
