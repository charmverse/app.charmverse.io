'use client';

import { log } from '@charmverse/core/log';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Container, Menu, MenuItem, Toolbar, AppBar, Button, Typography, Stack, IconButton } from '@mui/material';
import { revalidatePathAction } from '@packages/scoutgame/actions/revalidatePathAction';
import { logoutAction } from '@packages/scoutgame/session/logoutAction';
import { Avatar } from '@packages/scoutgame-ui/components/common/Avatar';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { SiteNavigation } from 'components/common/SiteNavigation';

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
        zIndex: 1,
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
            <Stack flexDirection='row' alignItems='center'>
              <Hidden mdDown>
                <SiteNavigation topNav />
              </Hidden>
              {user ? (
                <>
                  <Link href='/info'>
                    <IconButton size='small' sx={{ mr: { xs: 1, md: 3 } }}>
                      <InfoIcon color='secondary' />
                    </IconButton>
                  </Link>
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
                      data-test='user-menu-pill'
                    >
                      <Typography fontSize='16px' sx={{ pl: 2 }} color='text.primary' data-test='user-points-balance'>
                        {user.currentBalance}
                      </Typography>
                      <Image
                        src='/images/profile/scout-game-icon.svg'
                        width={20}
                        height={20}
                        alt='Scout Game points icon'
                        priority={true}
                      />
                      <Avatar src={user?.avatar || undefined} size='medium' name={user.displayName} />
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
                        <Link href='/profile'>{user.displayName}</Link>
                      </MenuItem>
                      <MenuItem onClick={() => logoutUser()} data-test='sign-out-button'>
                        Sign Out
                      </MenuItem>
                      {/* <InstallAppMenuItem>Install</InstallAppMenuItem> */}
                    </Menu>
                  </Box>
                </>
              ) : (
                <>
                  <Link href='/info'>
                    <IconButton size='small' sx={{ mr: { xs: 1, md: 3 } }}>
                      <InfoIcon color='secondary' />
                    </IconButton>
                  </Link>
                  <Button variant='gradient' href='/login' data-test='sign-in-button'>
                    Sign in
                  </Button>
                </>
              )}
            </Stack>
          </>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
