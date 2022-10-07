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
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import UserDisplay from 'components/common/UserDisplay';
import TokenGateRolesSelect from 'components/settings/roles/components/TokenGates/components/TokenGateRolesSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { InviteLinkPopulated } from 'pages/api/invites/index';

interface Props {
  isAdmin: boolean;
  invites: InviteLinkPopulated[];
  onDelete: (invite: InviteLinkPopulated) => void;
  refetchInvites: KeyedMutator<InviteLinkPopulated[]>;
}

export default function InvitesTable ({
  invites,
  isAdmin,
  refetchInvites,
  onDelete
}: Props) {
  const [space] = useCurrentSpace();

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
    const inviteLink = invites.find(_tokenGate => _tokenGate.id === inviteLinkId);
    if (inviteLink && space) {
      const roleIds = inviteLink.inviteLinkToRoles
        .map(inviteLinkToRole => inviteLinkToRole.roleId)
        .filter(inviteLinkRoleId => inviteLinkRoleId !== roleId);
      await charmClient.updateInviteLinkRoles(inviteLinkId, space.id, roleIds);
      refetchInvites();
    }
  }

  return (
    <Table size='small' aria-label='simple table'>
      <TableHead>
        <TableRow>
          <TableCell sx={{ px: 0 }}>Inviter</TableCell>
          {/* <TableCell>Invite Code</TableCell> */}
          <TableCell>Uses</TableCell>
          <TableCell>Expires</TableCell>
          <TableCell>Assigned Roles</TableCell>
          <TableCell>{/* actions */}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invites.map((invite) => (
          <TableRow key={invite.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell sx={{ px: 0 }}>
              <UserDisplay sx={{ my: 1 }} user={invite.author} avatarSize='small' />
            </TableCell>
            {/* <TableCell><Typography>{invite.code}</Typography></TableCell> */}
            <TableCell>
              <Typography>
                {invite.useCount}
                {invite.maxUses > 0 ? ` / ${invite.maxUses}` : ''}
              </Typography>
            </TableCell>
            <TableCell width={150}>{getExpires(invite)}</TableCell>
            <TableCell>
              <TokenGateRolesSelect
                selectedRoleIds={invite.inviteLinkToRoles.map(inviteLinkToRole => inviteLinkToRole.roleId)}
                onChange={(roleIds) => {
                  updateInviteLinkRoles(invite.id, roleIds);
                }}
                onDelete={(roleId) => {
                  deleteRoleFromInviteLink(invite.id, roleId);
                }}
              />
            </TableCell>
            <TableCell width={150} sx={{ px: 0 }} align='right'>
              <Tooltip
                arrow
                placement='top'
                title={copied[invite.id] ? 'Copied!' : 'Click to copy link'}
                disableInteractive
              >
                <Box component='span' pr={1}>
                  <CopyToClipboard text={getInviteLink(invite.code)} onCopy={() => onCopy(invite.id)}>
                    <Chip sx={{ width: 70 }} clickable color='secondary' size='small' variant='outlined' label={copied[invite.id] ? 'Copied!' : 'Share'} />
                  </CopyToClipboard>
                </Box>
              </Tooltip>
              {isAdmin && (
                <Tooltip arrow placement='top' title='Delete'>
                  <ButtonChip
                    className='invite-actions'
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
