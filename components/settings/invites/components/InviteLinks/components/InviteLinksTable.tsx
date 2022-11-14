import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DeleteIcon from '@mui/icons-material/Close';
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

import charmClient from 'charmClient';
import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import TokenGateRolesSelect from 'components/settings/invites/components/TokenGates/components/TokenGateRolesSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { InviteLinkPopulated } from 'pages/api/invites/index';

interface Props {
  isAdmin: boolean;
  invites: InviteLinkPopulated[];
  onDelete: (invite: InviteLinkPopulated) => void;
  refetchInvites: VoidFunction;
}

export default function InvitesTable (props: Props) {
  const { isAdmin, invites, onDelete, refetchInvites } = props;
  const space = useCurrentSpace();

  const [copied, setCopied] = useState<{ [id: string]: boolean }>({});

  function onCopy (id: string) {
    setCopied({ [id]: true });
    setTimeout(() => setCopied({ [id]: false }), 1000);
  }

  async function updateInviteLinkRoles (inviteLinkId: string, roleIds: string[]) {
    if (space) {
      await charmClient.updateInviteLinkRoles(inviteLinkId, space.id, roleIds);
      refetchInvites();
    }
  }

  async function deleteRoleFromInviteLink (inviteLinkId: string, roleId: string) {
    const inviteLink = invites.find(invite => invite.id === inviteLinkId);
    if (inviteLink && space) {
      const roleIds = inviteLink.inviteLinkToRoles
        .map(inviteLinkToRole => inviteLinkToRole.roleId)
        .filter(inviteLinkRoleId => inviteLinkRoleId !== roleId);
      await updateInviteLinkRoles(inviteLinkId, roleIds);
    }
  }

  const padding = 32;

  return (
    <Box overflow='auto'>
      <Table size='small' aria-label='Invite links table'>
        <TableHead>
          <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
            <TableCell sx={{ padding: '10px 16px' }}>Description</TableCell>
            <TableCell>Uses</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell sx={{ width: 150 }}>Assigned Role</TableCell>
            <TableCell sx={{ width: 90 + padding }} align='center'>Link</TableCell>
            <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invites.length === 0 && (
            <TableRow>
              <TableCell align='center' colSpan={6} sx={{ padding: '20px 16px' }}>This Workspace has no Invite Links</TableCell>
            </TableRow>
          )}
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell sx={{ padding: '20px 16px' }}>
                Private Link
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
                  selectedRoleIds={invite.inviteLinkToRoles.map(inviteLinkToRole => inviteLinkToRole.roleId)}
                  onChange={(roleIds) => {
                    updateInviteLinkRoles(invite.id, roleIds);
                  }}
                  onDelete={(roleId) => {
                    deleteRoleFromInviteLink(invite.id, roleId);
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
                      <Chip sx={{ width: 90 }} clickable color='secondary' size='small' variant='outlined' label={copied[invite.id] ? 'Copied!' : 'Copy Link'} />
                    </CopyToClipboard>
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell width={30}>
                {isAdmin && (
                  <Tooltip arrow placement='top' title='Delete'>
                    <ButtonChip
                      className='row-actions'
                      icon={<DeleteIcon />}
                      clickable
                      color='secondary'
                      size='small'
                      variant='outlined'
                      onClick={() => onDelete(invite)}
                    />
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function getInviteLink (code: string) {
  return `${window.location.origin}/invite/${code}`;
}

function getExpires (invite: InviteLinkPopulated) {
  if (invite.maxAgeMinutes > 0) {
    const expireDate = new Date(invite.createdAt).getTime() + (invite.maxAgeMinutes * 60 * 1000);
    if (expireDate < Date.now()) {
      return (
        <Tooltip arrow placement='top' title={`Expired on ${new Date(expireDate).toDateString()}`}>
          <Typography component='span'>Expired</Typography>
        </Tooltip>
      );
    }
    return (
      <Tooltip arrow placement='top' title={`Expires on ${new Date(expireDate).toDateString()}`}>
        <span><Countdown date={expireDate} /></span>
      </Tooltip>
    );
  }
  return <AllInclusiveIcon fontSize='small' />;
}
