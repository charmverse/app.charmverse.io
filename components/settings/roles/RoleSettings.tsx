import type { Space, Role } from '@charmverse/core/dist/prisma';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Card, CircularProgress, Divider, Menu, Paper, Typography } from '@mui/material';
import { useRef, useState } from 'react';

import Button from 'components/common/Button';
import Legend from 'components/settings/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useRoles } from 'hooks/useRoles';
import { scrollIntoView } from 'lib/utilities/browser';

import { AdminRoleRow } from './components/AdminRoleRow';
import type { CreateRoleInput } from './components/CreateRoleForm';
import { CreateRoleForm } from './components/CreateRoleForm';
import { GuestRoleRow } from './components/GuestRoleRow';
import ImportDiscordRolesMenuItem from './components/ImportDiscordRolesMenuItem';
import { MemberRoleRow } from './components/MemberRoleRow';
import { DefaultPagePermissions } from './components/RolePermissions/components/DefaultPagePermissions';
import { RoleRow } from './components/RoleRow';
import { useImportDiscordRoles } from './hooks/useImportDiscordRoles';

const formAnchorId = 'new-role-form-anchor';

export function RoleSettings({ space }: { space: Space }) {
  const { assignRoles, createRole, deleteRole, refreshRoles, roles } = useRoles();
  const isAdmin = useIsAdmin();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const { mutateMembers } = useMembers();
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isValidating } = useImportDiscordRoles();

  function showCreateRoleForm() {
    setIsCreateFormVisible(true);
    setTimeout(() => {
      scrollIntoView(`#${formAnchorId}`);
    }, 100);
  }

  function hideCreateRoleForm() {
    setIsCreateFormVisible(false);
  }

  function createNewRole(role: CreateRoleInput) {
    return createRole(role).then(() => {
      hideCreateRoleForm();
      mutateMembers();
      // scroll to bottom of roles list
      scrollIntoView(`#${formAnchorId}`);
    });
  }

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>Roles & Permissions</Legend>
      <DefaultPagePermissions />
      <Divider sx={{ my: 2 }} />
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
            <Button onClick={showCreateRoleForm} disabled={isValidating}>
              Add a role
            </Button>
          </Box>
        )}
      </Legend>
      <Typography variant='caption'>
        All users are assigned to either the Default, Admin, or Guest role. In addition to that role they can also have
        Custom Roles.
      </Typography>
      <MemberRoleRow readOnly={!isAdmin} spaceId={space.id} />
      <AdminRoleRow readOnly={!isAdmin} />
      <GuestRoleRow readOnly={!isAdmin} />
      <Divider sx={{ my: 2 }} />
      <Typography variant='body2' fontWeight='bold' color='secondary'>
        Custom roles
      </Typography>
      <Typography variant='caption'>Custom role permissions override Default.</Typography>
      {roles?.map((role) => (
        <RoleRow
          readOnly={!isAdmin}
          assignRoles={assignRoles}
          deleteRole={deleteRole}
          refreshRoles={refreshRoles}
          role={role}
          key={role.id}
        />
      ))}
      {roles?.length === 0 && !isCreateFormVisible && (
        <Box p={3} mt={2} sx={{ border: '1px solid var(--input-border)', textAlign: 'center' }}>
          <Typography sx={{ mb: 2 }} variant='body2' color='secondary'>
            No roles have been created yet.
          </Typography>
          <Button onClick={showCreateRoleForm} disabled={isValidating} variant='outlined'>
            Add a role
          </Button>
        </Box>
      )}
      {isCreateFormVisible && (
        <Box mt={2}>
          <CreateRoleForm onCancel={hideCreateRoleForm} onSubmit={createNewRole} />
        </Box>
      )}
      <div id={formAnchorId} />

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
    </>
  );
}
