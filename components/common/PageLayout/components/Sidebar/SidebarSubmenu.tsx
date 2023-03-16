import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { MouseEvent } from 'react';
import { useCallback, useState } from 'react';

import Avatar from 'components/common/Avatar';
import { CreateSpaceForm } from 'components/common/CreateSpaceForm';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

import { headerHeight } from '../Header/Header';

import SpaceListItem from './SpaceListItem';
import WorkspaceAvatar from './WorkspaceAvatar';

const StyledButton = styled(Button)(
  ({ theme, fullWidth }) => `
  justify-content: flex-start;
  padding: ${fullWidth ? theme.spacing(0.3, 5, 0.3, 2) : theme.spacing(0.5, 1)};

  &:hover: {
    backgroundColor: ${theme.palette.action.hover};
  }
  ${theme.breakpoints.up('lg')} {
    padding-right: ${fullWidth ? theme.spacing(2) : 0};
  }
`
);

const SidebarHeader = styled(Box)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: ${headerHeight}px;
  .MuiIconButton-root, .MuiButton-root {
    transition: ${theme.transitions.create('all', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })}
  }
  & .MuiIconButton-root {
    border-radius: 4px;
  }`
);

export default function SidebarSubmenu({
  closeSidebar,
  logoutCurrentUser,
  openProfileModal
}: {
  closeSidebar: () => void;
  logoutCurrentUser: () => void;
  openProfileModal: (event: MouseEvent<Element, globalThis.MouseEvent>, path?: string) => void;
}) {
  const theme = useTheme();
  const showMobileFullWidthModal = !useMediaQuery(theme.breakpoints.down('sm'));

  const currentSpace = useCurrentSpace();
  const { spaces, isCreatingSpace, setSpaces, isLoaded } = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const { user } = useUser();
  const { handleUserUpdate, isSaving } = useUserDetails({});

  function showSpaceForm() {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm() {
    setSpaceFormOpen(false);
  }

  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'profile-dropdown' });

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

  return (
    <SidebarHeader className='sidebar-header' position='relative'>
      <StyledButton
        data-test='sidebar-space-menu'
        endIcon={<KeyboardArrowDownIcon fontSize='small' />}
        variant='text'
        color='inherit'
        fullWidth={!!currentSpace}
        {...bindTrigger(menuPopupState)}
      >
        {currentSpace ? (
          <>
            <WorkspaceAvatar name={currentSpace.name} image={currentSpace.spaceImage ?? null} />
            <Typography variant='body1' data-test='sidebar-space-name' noWrap ml={1}>
              {currentSpace.name ?? 'Spaces'}
            </Typography>
          </>
        ) : user ? (
          <Avatar name={user.username} avatar={user.avatar ?? null} isNft={hasNftAvatar(user)} />
        ) : null}
      </StyledButton>
      <Menu onClick={menuPopupState.close} {...bindMenu(menuPopupState)} sx={{ maxWidth: '330px' }}>
        <MenuItem
          onClick={openProfileModal}
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
        <MenuItem onClick={logoutCurrentUser} data-test='logout-button'>
          Sign out
        </MenuItem>
      </Menu>
      {currentSpace && (
        <Tooltip title='Close sidebar' placement='bottom'>
          <IconButton onClick={closeSidebar} size='small' sx={{ position: 'absolute', right: 0, top: 12 }}>
            <MenuOpenIcon />
          </IconButton>
        </Tooltip>
      )}
      <Modal
        size='medium'
        open={spaceFormOpen}
        sx={{ width: showMobileFullWidthModal ? '100%' : undefined }}
        onClose={closeSpaceForm}
        mobileDialog
      >
        <CreateSpaceForm onCancel={closeSpaceForm} />
      </Modal>
    </SidebarHeader>
  );
}
