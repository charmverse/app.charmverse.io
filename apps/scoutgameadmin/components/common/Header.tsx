'use client';

import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import { Avatar, Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar, Stack } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { Hidden } from 'components/common/Hidden';
import { SiteNavigation } from 'components/common/SiteNavigation';

export function Header({ user }: { user: Pick<Scout, 'path' | 'avatar'> | null }) {
  const router = useRouter();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser, isExecuting: isExecutingLogout } = useAction(logoutAction, {
    onSuccess: async () => {
      revalidatePathAction();
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
        height: 58,
        backgroundColor: { xs: 'transparent', md: 'var(--mui-palette-AppBar-darkBg, var(--AppBar-background))' }
      }}
    >
      <Container maxWidth={false} sx={{ height: '100%' }}>
        <Toolbar
          disableGutters
          sx={{ height: '100%', justifyContent: 'space-between', alignItems: 'center' }}
          variant='dense'
        >
          <>
            <Link href='/home'>
              <Image
                src='/images/scout-game-logo.png'
                width={100}
                height={45}
                alt='Scout Game logo'
                priority={true}
                style={{ verticalAlign: 'middle' }}
              />
            </Link>
            <Stack flexDirection='row' gap={2} alignItems='center'>
              <Hidden mdDown>
                <SiteNavigation topNav isAuthenticated={!!user} />
              </Hidden>
              <IconButton disabled={isExecutingLogout} onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar src={user?.avatar || ''} />
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
                <MenuItem onClick={() => logoutUser()}>Sign Out</MenuItem>
              </Menu>
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
