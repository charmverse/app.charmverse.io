'use client';

import { log } from '@charmverse/core/log';
import { Avatar } from '@connect-shared/components/common/Avatar';
import { useDarkTheme } from '@connect-shared/hooks/useDarkTheme';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar } from '@mui/material';
import { useDatadogLogger } from '@root/hooks/useDatadogLogger';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

export function Header({ user }: { user: LoggedInUser | null }) {
  const path = usePathname();
  const router = useRouter();
  useDatadogLogger({ service: 'sunnyawards-browser', userId: user?.id });
  useDarkTheme();
  const farcasterDetails = user?.farcasterUser?.account as Required<FarcasterBody> | undefined;
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser } = useAction(logoutAction, {
    onSuccess: async () => {
      await revalidatePathAction();
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
                <MenuItem onClick={() => logoutUser({})}>Sign Out</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
