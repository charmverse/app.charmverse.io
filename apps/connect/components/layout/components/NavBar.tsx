'use client';

import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar } from '@mui/material';
import { ConnectApiClient } from 'apiClient/apiClient';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { Avatar } from 'components/common/Avatar';
import { InstallAppMenuItem } from 'components/layout/components/InstallAppMenuItem';
import { actionRevalidatePath } from 'lib/actions/revalidatePath';
import type { LoggedInUser } from 'lib/profile/interfaces';

export function NavBar({ user }: { user: LoggedInUser | null | undefined }) {
  const path = usePathname();
  const router = useRouter();
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
    await actionRevalidatePath();
    router.push('/');
  };

  return (
    <AppBar
      position='static'
      sx={{ backgroundColor: path === '/' ? 'background.default' : 'transparent', boxShadow: 'none', pt: 1 }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }} variant='dense'>
          <Link href='/'>
            <Image src='/images/connect-logo.png' width={15} height={40} alt='Connect logo' />
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
