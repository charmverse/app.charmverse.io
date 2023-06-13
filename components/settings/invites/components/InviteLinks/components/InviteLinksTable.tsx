import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Countdown from 'react-countdown';

import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import TokenGateRolesSelect from 'components/settings/invites/components/TokenGates/components/TokenGateRolesSelect';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';

import { ConfirmInviteLinkDeletion } from './ConfirmInviteLinkDeletion';

export function InvitesTable() {
  const isAdmin = useIsAdmin();
  const { updateInviteLinkRoles, deleteInviteLink, privateInvites } = useSpaceInvitesList();
  const [copied, setCopied] = useState<{ [id: string]: boolean }>({});

  const [inviteToDelete, setInviteToDelete] = useState<InviteLinkWithRoles | null>(null);

  function onCopy(id: string) {
    setCopied({ [id]: true });
    setTimeout(() => setCopied({ [id]: false }), 1000);
  }
  const padding = 32;

  function triggerInviteDeletion(invite: InviteLinkWithRoles) {
    if (invite.roleIds.length === 0) {
      deleteInviteLink(invite.id);
    } else {
      setInviteToDelete(invite);
    }
  }

  return (
    <Box overflow='auto'>
      <Table size='small' aria-label='Invite links table'>
        <TableHead>
          <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
            <TableCell sx={{ padding: '10px 16px' }}>Description</TableCell>
            <TableCell>Uses</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell sx={{ width: 150 }}>Assigned Role</TableCell>
            <TableCell sx={{ width: 90 + padding }} align='center'>
              Link
            </TableCell>
            <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {privateInvites?.length === 0 && (
            <TableRow>
              <TableCell align='center' colSpan={6} sx={{ padding: '20px 16px' }}>
                This Space has no Invite Links
              </TableCell>
            </TableRow>
          )}
          {privateInvites?.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell sx={{ padding: '20px 16px' }}>
                <Box display='flex' justifyContent='flex-start' gap={1}>
                  Private Link
                </Box>
              </TableCell>
              <TableCell>
                <Typography>
                  {invite.useCount}
                  {invite.maxUses > 0 ? ` / ${invite.maxUses}` : ''}
                </Typography>
              </TableCell>
              <TableCell width={150}>{getExpires(invite)}</TableCell>
              <TableCell width={150}>
                <TokenGateRolesSelect
                  isAdmin={isAdmin}
                  selectedRoleIds={invite.roleIds}
                  onChange={(roleIds) => {
                    updateInviteLinkRoles({ inviteLinkId: invite.id, roleIds });
                  }}
                  onDelete={(roleId) => {
                    updateInviteLinkRoles({
                      inviteLinkId: invite.id,
                      roleIds: invite.roleIds.filter((role) => role !== roleId)
                    });
                  }}
                />
              </TableCell>
              <TableCell width={90}>
                <Tooltip
                  arrow
                  placement='top'
                  title={copied[invite.id] ? 'Copied!' : 'Click to copy link'}
                  disableInteractive
                >
                  <Box component='span'>
                    <CopyToClipboard text={getInviteLink(invite.code)} onCopy={() => onCopy(invite.id)}>
                      <Chip
                        sx={{ width: 90 }}
                        clickable
                        color='secondary'
                        size='small'
                        variant='outlined'
                        label={copied[invite.id] ? 'Copied!' : 'Copy Link'}
                      />
                    </CopyToClipboard>
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell width={30}>
                {isAdmin && (
                  <Tooltip arrow placement='top' title='Delete'>
                    <ButtonChip
                      className='row-actions'
                      icon={<CloseIcon />}
                      clickable
                      color='secondary'
                      size='small'
                      variant='outlined'
                      onClick={() => triggerInviteDeletion(invite)}
                    />
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {inviteToDelete && (
        <ConfirmInviteLinkDeletion
          onClose={() => setInviteToDelete(null)}
          open
          invite={inviteToDelete}
          onConfirm={() => setInviteToDelete(null)}
        />
      )}
    </Box>
  );
}

function getInviteLink(code: string) {
  return `${window.location.origin}/invite/${code}`;
}

function getExpires(invite: InviteLinkWithRoles) {
  if (invite.maxAgeMinutes > 0) {
    const expireDate = new Date(invite.createdAt).getTime() + invite.maxAgeMinutes * 60 * 1000;
    if (expireDate < Date.now()) {
      return (
        <Tooltip arrow placement='top' title={`Expired on ${new Date(expireDate).toDateString()}`}>
          <Typography component='span'>Expired</Typography>
        </Tooltip>
      );
    }
    return (
      <Tooltip arrow placement='top' title={`Expires on ${new Date(expireDate).toDateString()}`}>
        <span>
          <Countdown date={expireDate} />
        </span>
      </Tooltip>
    );
  }
  return <AllInclusiveIcon fontSize='small' />;
}
