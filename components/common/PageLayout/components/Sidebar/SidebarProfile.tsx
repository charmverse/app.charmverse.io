import AddIcon from '@mui/icons-material/Add';
import { Divider, Menu, MenuItem, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/system';
import { bindMenu } from 'material-ui-popup-state';
import type { PopupState } from 'material-ui-popup-state/core';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

import { CreateSpaceForm } from 'components/common/CreateSpaceForm';
import { Modal } from 'components/common/Modal';
import SpaceListItem from 'components/common/PageLayout/components/Sidebar/SpaceListItem';
import UserDisplay from 'components/common/UserDisplay';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

export function SidebarProfile({
  hideProfile = false,
  menuPopupState
}: {
  hideProfile?: boolean;
  menuPopupState: PopupState;
}) {
  const { user, logoutUser } = useUser();
  const theme = useTheme();
  const { spaces, isCreatingSpace, isLoaded, setSpaces } = useSpaces();
  const { handleUserUpdate, isSaving } = useUserDetails({
    user: user!
  });
  const { disconnectWallet } = useWeb3AuthSig();
  const router = useRouter();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const currentSpace = useCurrentSpace();
  const showMobileFullWidthModal = !useMediaQuery(theme.breakpoints.down('sm'));

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

  function showSpaceForm() {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm() {
    setSpaceFormOpen(false);
  }

  return (
    <>
      <Menu onClick={menuPopupState.close} {...bindMenu(menuPopupState)} sx={{ maxWidth: '330px' }}>
        {!hideProfile && (
          <>
            <MenuItem
              component={NextLink}
              href='/nexus'
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gridTemplateRows: 'auto auto',
                columnGap: 1
              }}
            >
              <UserDisplay user={user} hideName gridColumn='1' gridRow='1/3' />
              <Typography variant='body2' noWrap>
                {user?.username}
              </Typography>
              <Typography variant='body2' color='secondary'>
                My Profile
              </Typography>
            </MenuItem>
            <Divider />
          </>
        )}
        <Typography component='p' variant='caption' mx={2} mb={0.5}>
          My Spaces
        </Typography>
        {spaces.map((_space) => (
          <SpaceListItem
            key={_space.id}
            disabled={isSaving || !isLoaded || isCreatingSpace}
            selected={currentSpace?.domain === _space.domain}
            space={_space}
            changeOrderHandler={changeOrderHandler}
          />
        ))}
        <MenuItem onClick={showSpaceForm} data-test='spaces-menu-add-new-space'>
          <AddIcon sx={{ m: '5px 15px 5px 8px' }} />
          Create or join a space
        </MenuItem>
        <Divider />
        <MenuItem onClick={logoutCurrentUser}>Sign out</MenuItem>
      </Menu>
      <Modal
        size='medium'
        open={spaceFormOpen}
        sx={{ width: showMobileFullWidthModal ? '100%' : undefined }}
        onClose={closeSpaceForm}
        mobileDialog
      >
        <CreateSpaceForm onCancel={closeSpaceForm} />
      </Modal>
    </>
  );
}
