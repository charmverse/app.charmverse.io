import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import NextLink from 'next/link';
import { useState } from 'react';

import Button from 'components/common/Button';
import CreateWorkspaceForm from 'components/common/CreateSpaceForm';
import { Modal } from 'components/common/Modal';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { headerHeight } from '../Header';

import WorkspaceAvatar from './WorkspaceAvatar';

const SidebarHeader = styled(Box)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing(1.5)};
  min-height: ${headerHeight}px;
  & .MuiIconButton-root {
    border-radius: 4px;
    transition: ${theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })};
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
  const currentSpace = useCurrentSpace();
  const { spaces, createNewSpace, isCreatingSpace } = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const { user } = useUser();

  function showSpaceForm() {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm() {
    setSpaceFormOpen(false);
  }

  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'profile-dropdown' });

  return (
    <SidebarHeader className='sidebar-header'>
      <Button
        data-test='sidebar-space-menu'
        endIcon={<KeyboardArrowDownIcon fontSize='small' />}
        variant='text'
        color='inherit'
        {...bindTrigger(menuPopupState)}
      >
        <Typography variant='body2' data-test='sidebar-space-name' fontWeight={600} noWrap>
          {currentSpace?.name}
        </Typography>
      </Button>
      <Menu {...bindMenu(menuPopupState)} onClick={menuPopupState.close}>
        <MenuItem component={NextLink} href='/profile'>
          <Box display='flex' flexDirection='row'>
            <Box>
              <UserDisplay user={user} hideName />
            </Box>
            <Box ml={1}>
              <Typography variant='body2' fontWeight={600}>
                {user?.username}
              </Typography>
              <Typography variant='body2' fontWeight={600}>
                My Profile
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        <Typography component='p' variant='caption' mx={2} mb={0.5} fontWeight={600}>
          My Spaces
        </Typography>
        {spaces.map((_space) => (
          <MenuItem key={_space.domain} component={NextLink} href={`/${_space.domain}`} sx={{ maxWidth: '276px' }}>
            <WorkspaceAvatar
              active={currentSpace?.domain === _space.domain}
              name={_space.name}
              image={_space.spaceImage}
            />
            <Typography noWrap ml={1} fontWeight={600}>
              <strong>{_space.name}</strong>
            </Typography>
          </MenuItem>
        ))}
        <MenuItem onClick={showSpaceForm} data-test='spaces-menu-add-new-space' sx={{ fontWeight: 600 }}>
          <AddIcon sx={{ m: '5px 15px 5px 8px' }} />
          Create or join a space
        </MenuItem>
        <Divider />
        <MenuItem onClick={logoutCurrentUser} sx={{ fontWeight: 600 }}>
          Sign out
        </MenuItem>
      </Menu>
      <IconButton onClick={closeSidebar} size='small'>
        <MenuOpenIcon />
      </IconButton>
      <Modal open={spaceFormOpen} onClose={closeSpaceForm}>
        <CreateWorkspaceForm onSubmit={createNewSpace} onCancel={closeSpaceForm} isSubmitting={isCreatingSpace} />
        <Typography variant='body2' align='center' sx={{ pt: 2 }}>
          <Button variant='text' href='/join' endIcon={<NavigateNextIcon />}>
            Join an existing space
          </Button>
        </Typography>
      </Modal>
    </SidebarHeader>
  );
}
