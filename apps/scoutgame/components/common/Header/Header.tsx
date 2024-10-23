'use client';

import { log } from '@charmverse/core/log';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import { Box, Container, Menu, MenuItem, Toolbar, AppBar, Button, Typography, Stack } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { Avatar } from 'components/common/Avatar';
import { Hidden } from 'components/common/Hidden';
import { SiteNavigation } from 'components/common/SiteNavigation';
import { useUser } from 'components/layout/UserProvider';

import { InstallAppMenuItem } from './components/InstallAppMenuItem';

export function Header() {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const { execute: logoutUser, isExecuting: isExecutingLogout } = useAction(logoutAction, {
    onSuccess: async () => {
      await refreshUser();
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
                <SiteNavigation topNav />
              </Hidden>
              {user ? (
                <Box
                  borderColor='secondary.main'
                  borderRadius='30px'
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderColor: 'secondary.main',
                      borderRadius: '28px',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      pointerEvents: 'none'
                    }
                  }}
                >
                  <Button
                    variant='text'
                    disabled={isExecutingLogout}
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Typography fontSize='16px' sx={{ pl: 2 }} color='text.primary' data-testid='user-points-balance'>
                      {user.currentBalance}
                    </Typography>
                    <Image
                      src='/images/profile/scout-game-icon.svg'
                      width={20}
                      height={20}
                      alt='Scout Game points icon'
                      priority={true}
                    />
                    <Avatar src={user?.avatar || undefined} size='medium' name={user.username} />
                  </Button>
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
                      <Link href='/profile'>{user.username}</Link>
                    </MenuItem>
                    <MenuItem onClick={() => logoutUser()}>Sign Out</MenuItem>
                    {/* <InstallAppMenuItem>Install</InstallAppMenuItem> */}
                  </Menu>
                </Box>
              ) : (
                <Button variant='gradient' LinkComponent={Link} href='/login' data-test='sign-in-button'>
                  Sign in
                </Button>
              )}
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
