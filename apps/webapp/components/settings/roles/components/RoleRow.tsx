import { useTheme } from '@emotion/react';
import { ArchiveOutlined, UnarchiveOutlined } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { bindMenu, bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import type { ListSpaceRolesResponse } from 'pages/api/roles';
import CollabLandIcon from 'public/images/logos/collabland_logo.svg';
import GuildXYZIcon from 'public/images/logos/guild_logo.svg';
import SummonDarkIcon from 'public/images/logos/summon_dark_mark.svg';
import SummonLightIcon from 'public/images/logos/summon_light_mark.svg';

import { RoleForm } from './RoleForm';
import { RolePermissions } from './RolePermissions/RolePermissions';
import { RoleRowBase } from './RoleRowBase';

type RoleRowProps = {
  readOnly: boolean;
  role: ListSpaceRolesResponse;
  assignRoles: (roleId: string, userIds: string[]) => void;
  deleteRole: (roleId: string) => void;
  refreshRoles: () => void;
  archiveRole: (roleId: string) => void;
  unarchiveRole: (roleId: string) => void;
};

export function RoleRow({
  readOnly,
  role,
  assignRoles,
  deleteRole,
  refreshRoles,
  archiveRole,
  unarchiveRole
}: RoleRowProps) {
  const menuState = usePopupState({ variant: 'popover', popupId: `role-${role.id}` });
  const confirmDeletePopupState = usePopupState({ variant: 'popover', popupId: 'role-delete' });
  const { members } = useMembers();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  async function addMembers(newMembers: string[]) {
    await assignRoles(role.id, newMembers);
  }

  const theme = useTheme();

  let descriptionIcon: ReactNode = null;
  let description: ReactNode = null;
  if (role.source === 'collabland') {
    descriptionIcon = CollabLandIcon;
    description = <>This role is managed by Collab.Land. Visit https://collab.land/ to modify this role</>;
  } else if (role.source === 'guild_xyz') {
    descriptionIcon = GuildXYZIcon;
    description = <>This role is managed by Guild XYZ. Visit https://guild.xyz/ to modify this role</>;
  } else if (role.source === 'summon') {
    descriptionIcon = theme.palette.mode === 'dark' ? SummonLightIcon : SummonDarkIcon;
    description = <>This role is managed by Summon</>;
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
      readOnlyMembers={readOnly}
      memberRoleId={role.id}
      archived={role.archived}
      title={`${role.name} ${role.archived ? '(Archived)' : ''}`}
      description={description}
      descriptionIcon={descriptionIcon}
      permissions={
        <RolePermissions
          targetGroup='role'
          id={role.id}
          disabled={role.archived}
          callback={() => {
            refreshRoles();
          }}
        />
      }
      roleActions={
        !readOnly &&
        role.source !== 'guild_xyz' &&
        role.source !== 'summon' && (
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
                disabled={role.archived}
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
                  if (role.archived) {
                    unarchiveRole(role.id);
                  } else {
                    archiveRole(role.id);
                  }
                  menuState.close();
                }}
              >
                <ListItemIcon>
                  {role.archived ? <UnarchiveOutlined fontSize='small' /> : <ArchiveOutlined fontSize='small' />}
                </ListItemIcon>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                  {role.archived ? 'Unarchive' : 'Archive'}
                </Typography>
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
