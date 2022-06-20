
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Legend from 'components/settings/Legend';
import ImportGuildRolesMenuItem from 'components/settings/roles/components/ImportGuildRolesMenuItem';
import useRoles from 'components/settings/roles/hooks/useRoles';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useEffect, useRef, useState } from 'react';
import { CircularProgress, Menu, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';
import { useSnackbar } from 'hooks/useSnackbar';
import charmClient from 'charmClient';
import useSWRImmutable from 'swr/immutable';
import { Space } from '@prisma/client';
import RoleRow from './components/RoleRow';
import RoleForm from './components/RoleForm';
import ImportDiscordRolesMenuItem from './components/ImportDiscordRolesMenuItem';
import SpacePermissions from './spacePermissions/SpacePermissions';

export default function RoleSettings () {
  const {
    assignRoles,
    deleteRole,
    refreshRoles,
    unassignRole,
    roles
  } = useRoles();
  const isAdmin = useIsAdmin();
  const popupState = usePopupState({ variant: 'popover', popupId: 'add-a-role' });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const router = useRouter();
  const { showMessage } = useSnackbar();

  const [space] = useCurrentSpace();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const shouldRequestServers = isAdmin && space && typeof router.query.guild_id === 'string' && router.query.discord === '1' && router.query.type === 'server';
  const serverConnectFailed = router.query.discord === '2' && router.query.type === 'server';
  const guildId = router.query.guild_id as string;
  // Using immutable version as otherwise the endpoint is hit twice
  const { data, isValidating, error } = useSWRImmutable(shouldRequestServers && space ? 'discord-roles-import' : null, async () => {
    return charmClient.importRolesFromDiscordServer({
      guildId,
      spaceId: (space as Space).id
    });
  });

  useEffect(() => {
    if (data && !isValidating) {
      showMessage(`Successfully imported ${data.importedRoleCount} discord roles`, 'success');
      router.replace(window.location.href.split('?')[0], undefined, { shallow: true });
    }
    else if (error) {
      // Major failure while trying to import discord server role
      showMessage(error.message || error.error || 'Something went wrong. Please try again', 'error');
    }
    else if (serverConnectFailed) {
      showMessage('Failed to connect to Discord', 'warning');
    }
  }, [data, isValidating, serverConnectFailed]);

  return (
    <>
      {/* Space permissions */}
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }} helperText='Actions that any member of your space can perform.'>
        Space permissions
      </Legend>
      <SpacePermissions targetGroup='space' id={space?.id as string} />

      {/* Roles */}
      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Roles
        {isAdmin && (
          <Box component='span' display='flex' gap={1}>
            <Button
              onClick={() => {
                setAnchorEl(buttonRef?.current);
              }}
              ref={buttonRef}
              variant='outlined'
              endIcon={(
                <KeyboardArrowDownIcon />
              )}
              disabled={isValidating}
            >
              Import roles
            </Button>
            <Button {...bindTrigger(popupState)} disabled={isValidating}>Add a role</Button>
          </Box>
        )}
      </Legend>
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

      {isValidating ? (
        <Box display='flex' alignItems='center' gap={1}>
          <CircularProgress size={24} />
          <Typography variant='subtitle1' color='secondary'>Importing roles from discord server</Typography>
        </Box>
      ) : roles?.map(role => (
        <RoleRow
          isEditable={isAdmin}
          assignRoles={assignRoles}
          unassignRole={unassignRole}
          deleteRole={deleteRole}
          refreshRoles={refreshRoles}
          role={role}
          key={role.id}
        />
      ))}
    </>
  );
}
