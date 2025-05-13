import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import Avatar from 'components/common/Avatar';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import { useUserDetails } from 'components/settings/profile/hooks/useUserDetails';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { headerHeight } from '../../Header/Header';

import { NotificationCountBox } from './NotificationsPopover';
import SpaceListItem from './SpaceListItem';
import WorkspaceAvatar from './WorkspaceAvatar';

const CreateSpaceForm = dynamic(() =>
  import('components/common/CreateSpaceForm/CreateSpaceForm').then((mod) => mod.StyledCreateSpaceForm)
);

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'enableHover'
})<{ enableHover: boolean }>(
  ({ theme, enableHover, fullWidth }) => `
  justify-content: flex-start;
  padding: ${fullWidth ? theme.spacing(0.3, 5, 0.3, 2) : theme.spacing(0.5, 1)};

  ${!enableHover && `background-color: transparent !important; cursor: default;`}

  ${
    // disable hover UX on ios which converts first click to a hover event
    enableHover &&
    `
  @media (pointer: fine) {
    &:hover: {
      background-color: ${theme.palette.action.hover};
    }
  }`
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
      duration: theme.transitions.duration.shorter
    })}
  }

  & .MuiIconButton-root {
    background-color: ${theme.palette.background.light};
    border-radius: 4px;
    padding: 2px;
  }
  & .MuiIconButton-root:hover {
    background-color: ${theme.palette.background.default};
  }
`
);

export default function SidebarSubmenu({
  closeSidebar,
  logoutCurrentUser
}: {
  closeSidebar: () => void;
  logoutCurrentUser: () => void;
}) {
  const { showUserProfile } = useMemberProfileDialog();
  const { notifications = [], otherSpacesUnreadNotifications } = useNotifications();
  const theme = useTheme();
  const showMobileFullWidthModal = !useMediaQuery(theme.breakpoints.down('sm'));

  const { space: currentSpace } = useCurrentSpace();
  const { spaces, isCreatingSpace, setSpaces, isLoaded } = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const { user } = useUser();
  const { saveUser, isSaving } = useUserDetails();

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
      await saveUser({ spacesOrder: newOrder });
      const newOrderedSpaces = spaces.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      setSpaces(newOrderedSpaces);
    },
    [saveUser, spaces]
  );

  return (
    <SidebarHeader className='sidebar-header' position='relative'>
      <StyledButton
        data-test='sidebar-space-menu'
        enableHover={!!user}
        endIcon={user ? <KeyboardArrowDownIcon fontSize='small' /> : null}
        variant='text'
        color='inherit'
        fullWidth={!!currentSpace}
        {...(user ? bindTrigger(menuPopupState) : {})}
      >
        {currentSpace ? (
          <>
            <WorkspaceAvatar size='xSmall' name={currentSpace.name} image={currentSpace.spaceImage ?? null} />
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
          onClick={() => {
            if (user) {
              showUserProfile(user.id);
            }
          }}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gridTemplateRows: 'auto auto',
            columnGap: 1
          }}
        >
          <UserDisplay userId={user?.id} hideName gridColumn='1' gridRow='1/3' />
          <Typography variant='body2' noWrap>
            {user?.username}
          </Typography>
          <Typography variant='body2' color='secondary'>
            My Profile
          </Typography>
        </MenuItem>
        <Divider />
        <Typography component='p' variant='caption' mx={2} mb={1}>
          My Spaces
        </Typography>
        <Stack gap={1}>
          {spaces.map((_space) => (
            <SpaceListItem
              notifications={notifications}
              key={_space.id}
              disabled={isSaving || !isLoaded || isCreatingSpace}
              selected={currentSpace?.domain === _space.domain}
              space={_space}
              changeOrderHandler={changeOrderHandler}
            />
          ))}
        </Stack>
        <MenuItem onClick={showSpaceForm} data-test='spaces-menu-add-new-space'>
          <AddIcon sx={{ m: '5px 15px 5px 8px' }} />
          Create or join a space
        </MenuItem>
        <Divider />
        <MenuItem onClick={logoutCurrentUser} data-test='logout-button'>
          Sign out
        </MenuItem>
      </Menu>
      <Box sx={{ position: 'absolute', right: 0 }} pr={1}>
        {currentSpace && (
          <Tooltip title='Close sidebar' placement='bottom'>
            <IconButton onClick={closeSidebar} size='small'>
              <MenuOpenIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}

        {otherSpacesUnreadNotifications.length ? (
          <NotificationCountBox ml={0.5} mr={0.5}>
            {otherSpacesUnreadNotifications.length}
          </NotificationCountBox>
        ) : null}
      </Box>

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
