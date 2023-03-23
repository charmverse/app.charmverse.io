import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Grid, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState, bindPopover } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Button from 'components/common/Button';
import { InputSearchMemberMultiple } from 'components/common/form/InputSearchMember';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import type { ListSpaceRolesResponse } from 'pages/api/roles';
import GuildXYZIcon from 'public/images/guild_logo.svg';

import RoleForm from './RoleForm';
import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

type RoleRowProps = {
  readOnly: boolean;
  role: ListSpaceRolesResponse;
  assignRoles: (roleId: string, userIds: string[]) => void;
  deleteRole: (roleId: string) => void;
  refreshRoles: () => void;
};

const syncedRoleProps = {
  guild_xyz: {
    descriptionIcon: <GuildXYZIcon />,
    description: <>This role is managed by Guild XYZ. Visit https://guild.xyz/ to modify this role</>
  },
  collabland: {
    descriptionIcon: <GuildXYZIcon />,
    description: <>This role is managed by Collab.land. Visit https://collab.land/ to modify this role</>
  }
};

export function RoleRow({ readOnly, role, assignRoles, deleteRole, refreshRoles }: RoleRowProps) {
  const menuState = usePopupState({ variant: 'popover', popupId: `role-${role.id}` });
  const userPopupState = usePopupState({ variant: 'popover', popupId: `role-${role.id}-users` });
  const confirmDeletePopupState = usePopupState({ variant: 'popover', popupId: 'role-delete' });
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const { members } = useMembers();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });

  function showMembersPopup() {
    setNewMembers([]);
    userPopupState.open();
  }

  function onChangeNewMembers(ids: string[]) {
    setNewMembers(ids);
  }

  async function addMembers() {
    await assignRoles(role.id, newMembers);
    userPopupState.close();
  }

  const assignedMembers = members.filter((member) => member.roles.some((r) => r.id === role.id));

  const assignedMemberIds = assignedMembers.map((m) => m.id);

  return (
    <RoleRowBase
      members={assignedMembers}
      readOnlyMembers={!!role.source}
      memberRoleId={role.id}
      title={role.name}
      {...((role.source && syncedRoleProps[role.source]) || {})}
      permissions={
        <RolePermissions
          targetGroup='role'
          id={role.id}
          callback={() => {
            refreshRoles();
          }}
        />
      }
      roleActions={
        !readOnly &&
        role.source !== 'guild_xyz' && (
          <>
            <div onClick={(e) => e.stopPropagation()}>
              <IconButton size='small' {...bindTrigger(menuState)}>
                <MoreHorizIcon data-test={`open-role-context-menu-${role.id}`} />
              </IconButton>
            </div>

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
                  popupState.open();
                  menuState.close();
                }}
              >
                <ListItemIcon>
                  <EditOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Rename</Typography>
              </MenuItem>
              <MenuItem
                sx={{ padding: '3px 12px' }}
                onClick={() => {
                  confirmDeletePopupState.open();
                  menuState.close();
                }}
              >
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Delete</Typography>
              </MenuItem>
            </Menu>
            <ConfirmDeleteModal
              title='Delete role'
              question={`Are you sure you want to delete the ${role.name} role?`}
              buttonText={`Delete ${role.name}`}
              onConfirm={() => {
                deleteRole(role.id);
                menuState.close();
              }}
              onClose={confirmDeletePopupState.close}
              open={confirmDeletePopupState.isOpen}
            />
            <Modal {...bindPopover(popupState)} title='Rename role'>
              <RoleForm
                mode='edit'
                role={role}
                submitted={() => {
                  popupState.close();
                  refreshRoles();
                }}
              />
            </Modal>
          </>
        )
      }
      addMemberButton={
        !role.source &&
        !readOnly && (
          <Box mt={2}>
            {assignedMembers.length < members.length ? (
              <Button onClick={showMembersPopup} variant='text' color='secondary'>
                + Add members
              </Button>
            ) : (
              <Typography variant='caption'>All space members have been added to this role</Typography>
            )}
            <Modal open={userPopupState.isOpen} onClose={userPopupState.close} title='Add members'>
              <Grid container direction='column' spacing={3}>
                <Grid item>
                  <InputSearchMemberMultiple
                    filter={{ mode: 'exclude', userIds: assignedMemberIds }}
                    onChange={onChangeNewMembers}
                  />
                </Grid>
                <Grid item>
                  <Button onClick={addMembers}>Add</Button>
                </Grid>
              </Grid>
            </Modal>
          </Box>
        )
      }
    />
  );
}
