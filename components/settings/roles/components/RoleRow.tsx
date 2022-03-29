import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Modal from 'components/common/Modal';
import Grid from '@mui/material/Grid';
import Button from 'components/common/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import { InputSearchContributorMultiple } from 'components/common/form/InputSearchContributor';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useState } from 'react';
import { Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { ListSpaceRolesResponse } from 'charmClient';
import RoleMemberRow from './RoleMemberRow';

interface RoleRowProps {
  role: ListSpaceRolesResponse
  assignRoles: (roleId: string, userIds: string[]) => void;
  deleteRole: (roleId: string) => void;
  unassignRole: (roleId: string, userId: string) => void;
}

export default function RoleRow ({ role, assignRoles, unassignRole, deleteRole }: RoleRowProps) {

  const menuState = usePopupState({ variant: 'popover', popupId: `role-${role.id}` });
  const userPopupState = usePopupState({ variant: 'popover', popupId: `role-${role.id}-users` });
  const [newMembers, setNewMembers] = useState<string[]>([]);

  function showMembersPopup () {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers (ids: string[]) {
    setNewMembers(ids);
  }

  async function addMembers () {
    await assignRoles(role.id, newMembers);
    userPopupState.close();
  }

  const contributors = role.spaceRolesToRole.map(r => r.spaceRole.user);

  function removeMember (userId: string) {
    unassignRole(role.id, userId);
  }

  return (
    <Box mb={3}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6'>
          {role.name}
        </Typography>
        <IconButton size='small' {...bindTrigger(menuState)}>
          <MoreHorizIcon />
        </IconButton>
      </Box>
      <Divider />

      {contributors.map(contributor => <RoleMemberRow contributor={contributor} onRemove={removeMember} />)}

      <Button onClick={showMembersPopup} variant='text' color='secondary'>+ Add members</Button>

      <Menu
        {...bindMenu(menuState)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem
          sx={{ padding: '3px 12px' }}
          onClick={() => {
            deleteRole(role.id);
            menuState.close();
          }}
        >
          <ListItemIcon><DeleteIcon fontSize='small' /></ListItemIcon>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>
      <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <InputSearchContributorMultiple onChange={onChangeNewMembers} />
          </Grid>
          <Grid item>
            <Button onClick={addMembers}>Add</Button>
          </Grid>
        </Grid>
      </Modal>
    </Box>
  );
}
