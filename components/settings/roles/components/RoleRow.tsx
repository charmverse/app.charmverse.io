import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState, bindPopover } from 'material-ui-popup-state/hooks';

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
  const confirmDeletePopupState = usePopupState({ variant: 'popover', popupId: 'role-delete' });
  const { members } = useMembers();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  async function addMembers(newMembers: string[]) {
    await assignRoles(role.id, newMembers);
  }

  const assignedMembers = members.filter(
    (member) => !member.isBot && !member.isGuest && member.roles.some((r) => r.id === role.id)
  );
  const eligibleMembers = members.filter(
    (member) => !member.isGuest && !member.isBot && !assignedMembers.some((m) => m.id === member.id)
  );

  return (
    <RoleRowBase
      members={assignedMembers}
      eligibleMembers={eligibleMembers}
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
            <IconButton size='small' {...bindTrigger(menuState)}>
              <MoreHorizIcon />
            </IconButton>

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
      onAddMembers={!role.source && !readOnly ? addMembers : undefined}
    />
  );
}
