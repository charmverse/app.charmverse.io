import { ArchiveOutlined, UnarchiveOutlined } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { bindMenu, bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useCallback, type ReactNode } from 'react';

import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import { useRoleAccess } from 'hooks/useRoleAccess';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

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
  const { showMessage } = useSnackbar();
  const { canCreateRole } = useRoleAccess();

  const descriptionIcon: ReactNode = null;
  const description: ReactNode = null;

  const assignedMembers = members.filter(
    (member) => !member.isBot && !member.isGuest && member.roles.some((r) => r.id === role.id)
  );
  const eligibleMembers = members.filter(
    (member) => !member.isGuest && !member.isBot && !assignedMembers.some((m) => m.id === member.id)
  );

  const toggleRoleArchive = useCallback(async () => {
    try {
      if (role.archived) {
        await unarchiveRole(role.id);
      } else {
        await archiveRole(role.id);
      }
      refreshRoles();
      showMessage(`Role ${role.archived ? 'unarchived' : 'archived'} successfully`);
    } catch (error) {
      showMessage((error as Error).message || `Failed to ${role.archived ? 'unarchive' : 'archive'} role`, 'error');
    } finally {
      menuState.close();
    }
  }, [role.archived, unarchiveRole, archiveRole, refreshRoles, showMessage, menuState, role.id]);

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
        !readOnly && (
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
                onClick={toggleRoleArchive}
                disabled={role.archived ? !canCreateRole : false}
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
