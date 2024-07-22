'use client';

import { log } from '@charmverse/core/log';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { useDarkTheme } from 'hooks/useDarktheme';
import { actionRevalidatePath } from 'lib/actions/revalidatePath';
import type { LoggedInUser } from 'lib/profile/getCurrentUserAction';
import { logoutAction } from 'lib/session/logoutAction';

import { Avatar } from '../common/Avatar';

export function NavBar({ user }: { user: LoggedInUser | null | undefined }) {
  const path = usePathname();
  const router = useRouter();
  useDarkTheme();
  const farcasterDetails = user?.farcasterUser?.account as Required<FarcasterBody> | undefined;
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser } = useAction(logoutAction, {
    onSuccess: async () => {
      await actionRevalidatePath();
      router.push('/');
    },
    onError(err) {
      log.error('Error on logout', { error: err.error.serverError });
    }
  });

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
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
                <MenuItem onClick={() => logoutUser()}>Sign Out</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
