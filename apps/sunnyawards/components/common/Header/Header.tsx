'use client';

import { log } from '@charmverse/core/log';
import { Avatar } from '@connect-shared/components/common/Avatar';
import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { revalidatePathAction } from '@connect-shared/lib/actions/revalidatePathAction';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { logoutAction } from '@connect-shared/lib/session/logoutAction';
import type { StatusAPIResponse as FarcasterBody } from '@farcaster/auth-kit';
import { Box, Container, IconButton, Menu, MenuItem, Toolbar, AppBar, Link as MuiLink } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type { MouseEvent } from 'react';
import { useState } from 'react';

export function Header({ user }: { user: LoggedInUser | null }) {
  const router = useRouter();
  const trackEvent = useTrackEvent();
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
        backgroundColor: 'transparent',
        boxShadow: 'none',
        pt: 1
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }} variant='dense'>
          <MuiLink component={Link} href='/' fontSize={21} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image src='/images/sunnys-icon.webp' width={15} height={34} alt='Connect logo' />
            THE SUNNYS
          </MuiLink>
          {user ? (
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
                  <Link href='/profile'>My Profile</Link>
                </MenuItem>
                <MenuItem onClick={() => logoutUser({})}>Sign Out</MenuItem>
              </Menu>
            </Box>
          ) : (
            <MuiLink
              href='https://www.thesunnyawards.fun/'
              target='_blank'
              sx={{ fontWeight: '500' }}
              onMouseDown={() => {
                trackEvent('click_join_the_sunnys');
              }}
            >
              Join The SUNNYs
            </MuiLink>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
