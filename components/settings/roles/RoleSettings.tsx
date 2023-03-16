import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { CircularProgress, Menu, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { Space } from '@prisma/client';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import { useIsAdmin } from 'hooks/useIsAdmin';
import useRoles from 'hooks/useRoles';

import { AdminRoleRow } from './components/AdminRoleRow';
import { GuestRoleRow } from './components/GuestRoleRow';
import ImportDiscordRolesMenuItem from './components/ImportDiscordRolesMenuItem';
import { MemberRoleRow } from './components/MemberRoleRow';
import RoleForm from './components/RoleForm';
import { RoleRow } from './components/RoleRow';
import { useImportDiscordRoles } from './hooks/useImportDiscordRoles';

export default function RoleSettings({ space }: { space: Space }) {
  const { assignRoles, deleteRole, refreshRoles, unassignRole, roles } = useRoles();
  const isAdmin = useIsAdmin();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isValidating } = useImportDiscordRoles();

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>Roles & Permissions</Legend>

      <Legend noBorder display='flex' justifyContent='space-between' mt={4} mb={0}>
        Roles
        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            <Button
              onClick={() => {
                setAnchorEl(buttonRef?.current);
              }}
              ref={buttonRef}
              variant='outlined'
              endIcon={<KeyboardArrowDownIcon />}
              disabled={isValidating}
            >
              Import roles
            </Button>
            <Button {...bindTrigger(popupState)} disabled={isValidating}>
              Add a role
            </Button>
          </Box>
        )}
      </Legend>
      <AdminRoleRow readOnly={!isAdmin} />
      <MemberRoleRow readOnly={!isAdmin} spaceId={space.id} />

      {roles?.map((role) => (
        <RoleRow
          readOnly={!isAdmin}
          assignRoles={assignRoles}
          unassignRole={unassignRole}
          deleteRole={deleteRole}
          refreshRoles={refreshRoles}
          role={role}
          key={role.id}
        />
      ))}

      <GuestRoleRow readOnly={!isAdmin} />

      {isValidating && (
        <Box display='flex' alignItems='center' gap={1}>
          <CircularProgress size={24} />
          <Typography variant='subtitle1' color='secondary'>
            Importing roles from discord server
          </Typography>
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <ImportDiscordRolesMenuItem />
        <ImportGuildRolesMenuItem onClose={handleClose} />
      </Menu>
      <Modal {...bindPopover(popupState)} title='Add a role'>
        <RoleForm
          mode='create'
          submitted={() => {
            popupState.close();
            refreshRoles();
          }}
        />
      </Modal>
    </>
  );
}
