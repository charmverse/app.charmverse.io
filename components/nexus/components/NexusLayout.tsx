import MoonIcon from '@mui/icons-material/DarkMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SunIcon from '@mui/icons-material/WbSunny';
import { Divider, IconButton, Menu, MenuItem, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { Box, useTheme } from '@mui/system';
import { bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

import PageLayout from 'components/common/PageLayout';
import Account from 'components/common/PageLayout/components/Account';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import NotificationsBadge from 'components/common/PageLayout/components/Sidebar/NotificationsBadge';
import SpaceListItem from 'components/common/PageLayout/components/Sidebar/SpaceListItem';
import { AppBar } from 'components/common/PageLayout/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import { useColorMode } from 'context/darkMode';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

export default function NexusLayout(props: { children: ReactNode }) {
  // hide sidebar for public users for now, since they can't create a workspace
  const { user, logoutUser } = useUser();
  const theme = useTheme();
  const colorMode = useColorMode();
  const { spaces, isCreatingSpace, isLoaded, setSpaces } = useSpaces();
  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'profile-dropdown' });
  const { handleUserUpdate, isSaving } = useUserDetails({
    user: user!
  });
  const { disconnectWallet } = useWeb3AuthSig();
  const router = useRouter();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const changeOrderHandler = useCallback(
    async (draggedProperty: string, droppedOnProperty: string) => {
      const newOrder = spaces.map((s) => s.id);
      const propIndex = newOrder.indexOf(draggedProperty); // find the property that was dragged
      newOrder.splice(propIndex, 1); // remove the dragged property from the array
      const droppedOnIndex = newOrder.indexOf(droppedOnProperty); // find the index of the space that was dropped on
      newOrder.splice(droppedOnIndex, 0, draggedProperty); // add the property to the new index
      await handleUserUpdate({ spacesOrder: newOrder });
      const newOrderedSpaces = spaces.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      setSpaces(newOrderedSpaces);
    },
    [handleUserUpdate, spaces]
  );

  async function logoutCurrentUser() {
    disconnectWallet();
    await logoutUser();
    router.push('/');
  }

  return (
    <PageLayout hideSidebar sidebarWidth={user ? 55 : 0}>
      <AppBar sidebarWidth={0} position='fixed' open={false}>
        <StyledToolbar variant='dense'>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1
              }}
            >
              <UserDisplay user={user} hideName onClick={menuPopupState.open} />
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <PageTitleWithBreadcrumbs />
              </div>
            </Box>
            <Menu onClick={menuPopupState.close} {...bindMenu(menuPopupState)} sx={{ maxWidth: '330px' }}>
              <Typography component='p' variant='caption' mx={2} mb={0.5}>
                My Spaces
              </Typography>
              {spaces.map((_space) => (
                <SpaceListItem
                  key={_space.id}
                  disabled={isSaving || !isLoaded || isCreatingSpace}
                  space={_space}
                  changeOrderHandler={changeOrderHandler}
                />
              ))}
              <Divider />
              <MenuItem onClick={logoutCurrentUser}>Sign out</MenuItem>
            </Menu>
            <Box display='flex' alignItems='center'>
              {user && (
                <NotificationsBadge>
                  <IconButton
                    size={isLargeScreen ? 'small' : 'medium'}
                    LinkComponent={NextLink}
                    href='/nexus'
                    color='inherit'
                  >
                    <NotificationsIcon fontSize='small' color='secondary' />
                  </IconButton>
                </NotificationsBadge>
              )}
              {/** dark mode toggle */}
              <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='top'>
                <IconButton onClick={colorMode.toggleColorMode} color='inherit'>
                  {theme.palette.mode === 'dark' ? (
                    <SunIcon color='secondary' fontSize='small' />
                  ) : (
                    <MoonIcon color='secondary' fontSize='small' />
                  )}
                </IconButton>
              </Tooltip>
              {/** user account */}
              {!user && <Account />}
            </Box>
          </Box>
        </StyledToolbar>
      </AppBar>
      <CenteredPageContent>{props.children}</CenteredPageContent>
    </PageLayout>
  );
}
