import type { Space } from '@charmverse/core/prisma';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, CircularProgress, Divider, Menu, Typography, Alert } from '@mui/material';
import { scrollIntoView } from '@packages/lib/utils/browser';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';

import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/components/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';
import { useRoleAccess } from 'hooks/useRoleAccess';
import { useRoles } from 'hooks/useRoles';

import { UpgradeChip, UpgradeWrapper } from '../subscription/UpgradeWrapper';

import { AdminRoleRow } from './components/AdminRoleRow';
import type { CreateRoleInput } from './components/CreateRoleForm';
import { CreateRoleForm } from './components/CreateRoleForm';
import { GuestRoleRow } from './components/GuestRoleRow';
import { ImportDiscordRolesMenuItem } from './components/ImportDiscordRolesMenuItem';
import { MemberRoleRow } from './components/MemberRoleRow';
import { DefaultPagePermissions } from './components/RolePermissions/components/DefaultPagePermissions';
import { RoleRow } from './components/RoleRow';
import { CustomRolesInfoModal } from './CustomRolesInfoModal';

const formAnchorId = 'new-role-form-anchor';

export function RoleSettings({ space }: { space: Space }) {
  const { assignRoles, createRole, deleteRole, refreshRoles, roles, archiveRole, unarchiveRole } = useRoles({
    includeArchived: true
  });
  const isAdmin = useIsAdmin();
  const rolesInfoPopup = usePopupState({ variant: 'popover', popupId: 'roles-info-popup' });
  const { isFreeSpace } = useIsFreeSpace();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const { mutateMembers } = useMembers();
  const { canCreateRole, hasReachedLimit, currentCount, maxCount } = useRoleAccess({ space });

  useTrackPageView({ type: 'settings/roles-and-permissions' });

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isLoading: isValidating } = useDiscordConnection();

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

  const roleLimitTooltip = !isAdmin
    ? 'Only space admins can create roles'
    : !canCreateRole
      ? `You have reached the maximum number of custom roles (${currentCount}/${maxCount}) for your subscription tier`
      : '';

  return (
    <>
      <Legend sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        Roles & Permissions
        <UpgradeChip upgradeContext='custom_roles' onClick={rolesInfoPopup.open} />
      </Legend>

      <DefaultPagePermissions />
      <Divider sx={{ my: 2 }} />
      <Legend noBorder display='flex' justifyContent='space-between' mt={4} mb={0}>
        <Box gap={2} display='flex' justifyContent='space-between'>
          Roles
        </Box>

        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            <UpgradeWrapper upgradeContext='custom_roles' onClick={rolesInfoPopup.open}>
              <Button
                onClick={() => {
                  setAnchorEl(buttonRef?.current);
                }}
                ref={buttonRef}
                variant='outlined'
                endIcon={<KeyboardArrowDownIcon />}
                disabled={isValidating || isFreeSpace}
              >
                Import roles
              </Button>
            </UpgradeWrapper>
            <UpgradeWrapper upgradeContext='custom_roles' onClick={rolesInfoPopup.open}>
              <Button
                onClick={showCreateRoleForm}
                disabled={isValidating || isFreeSpace || !canCreateRole}
                title={roleLimitTooltip}
              >
                Add a role
              </Button>
            </UpgradeWrapper>
          </Box>
        )}
      </Legend>
      <Typography variant='caption'>
        All users are assigned to either the Default, Admin, or Guest role. In addition to that role they can also have
        Custom Roles.
      </Typography>
      <MemberRoleRow readOnly={!isAdmin} spaceId={space.id} />
      <AdminRoleRow readOnly={!isAdmin} />

      {!isFreeSpace && (
        <>
          <GuestRoleRow readOnly={!isAdmin || isFreeSpace} />
          <Divider sx={{ my: 2 }} />

          <Typography variant='body2' fontWeight='bold' color='secondary' gap={1} display='flex' alignItems='center'>
            Custom roles
            {hasReachedLimit && (
              <Typography variant='caption' color='error'>
                (Limit reached: {currentCount}/{maxCount})
              </Typography>
            )}
          </Typography>
          {isAdmin && roles?.some((role) => role.archived) && (
            <Alert severity='info' sx={{ mt: 1 }}>
              After upgrading your subscription, you'll need to manually unarchive any token gates, roles, or workflows
              that you want to keep using.
            </Alert>
          )}
          <Typography variant='caption'>Custom role permissions override Default.</Typography>
          {roles?.map((role) => (
            <RoleRow
              readOnly={!!role.source || !isAdmin}
              assignRoles={assignRoles}
              deleteRole={deleteRole}
              refreshRoles={refreshRoles}
              role={role}
              key={role.id}
              archiveRole={archiveRole}
              unarchiveRole={unarchiveRole}
            />
          ))}
          {roles?.length === 0 && !isCreateFormVisible && !isFreeSpace && (
            <Box p={3} mt={2} sx={{ border: '1px solid var(--input-border)', textAlign: 'center' }}>
              <Typography variant='body2' color='secondary'>
                No roles have been created yet.
              </Typography>
              {isAdmin && (
                <Button
                  sx={{ mt: 2 }}
                  onClick={showCreateRoleForm}
                  disabled={isValidating || !canCreateRole}
                  title={roleLimitTooltip}
                  variant='outlined'
                >
                  Add a role
                </Button>
              )}
            </Box>
          )}
        </>
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
        <ImportDiscordRolesMenuItem onClose={handleClose} />
        <ImportGuildRolesMenuItem onClose={handleClose} />
      </Menu>

      <CustomRolesInfoModal onClose={rolesInfoPopup.close} isOpen={rolesInfoPopup.isOpen} />
    </>
  );
}
