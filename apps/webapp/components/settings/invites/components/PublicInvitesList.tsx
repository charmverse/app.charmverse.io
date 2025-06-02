import type { PublicInviteLinkContext } from '@charmverse/core/prisma';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import { ConfirmInviteLinkDeletion } from 'components/settings/invites/components/InviteLinks/components/ConfirmInviteLinkDeletion';
import TokenGateRolesSelect from 'components/settings/invites/components/TokenGates/components/TokenGateRolesSelect';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import type { BrandColor } from 'theme/colors';

const colorMapping: Record<PublicInviteLinkContext, BrandColor> = {
  proposals: 'purple'
};

const labels: Record<PublicInviteLinkContext, string> = {
  proposals: 'Proposals'
};

type InviteRowProps = {
  invite: InviteLinkWithRoles & { visibleOn: PublicInviteLinkContext };
  isAdmin: boolean;
  updateInviteLinkRoles: (args: { inviteLinkId: string; roleIds: string[] }) => void;
  deleteInviteLink: (id: string) => void;
};

function InviteRow({ invite, isAdmin, updateInviteLinkRoles, deleteInviteLink }: InviteRowProps) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  const {
    isOpen,
    close: closeDeleteConfirmation,
    open: openDeleteConfirmation
  } = usePopupState({ variant: 'popover', popupId: `delete-invite-${invite.id}` });

  function removeInvite() {
    if (invite.roleIds.length > 0) {
      openDeleteConfirmation();
    } else {
      deleteInviteLink(invite.id);
    }
  }

  return (
    <>
      <TableRow key={invite.id}>
        <TableCell sx={{ padding: '20px 16px' }}>
          <Box display='flex' justifyContent='flex-start' gap={1}>
            {invite.visibleOn === 'proposals' ? 'Public proposals' : 'Private'} Link
            {invite.visibleOn === 'proposals' && (
              <Tooltip title='Anyone can join your space from the public proposals page'>
                <InfoOutlinedIcon color='secondary' fontSize='small' />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Typography>
            <Chip label={labels[invite.visibleOn]} color={colorMapping[invite.visibleOn]} />
          </Typography>
        </TableCell>
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
          <Tooltip arrow placement='top' title={copied ? 'Copied!' : 'Click to copy link'} disableInteractive>
            <Box component='span'>
              <CopyToClipboard text={getInviteLink(invite.code)} onCopy={onCopy}>
                <Chip
                  sx={{ width: 90 }}
                  clickable
                  color='secondary'
                  size='small'
                  variant='outlined'
                  label={copied ? 'Copied!' : 'Copy Link'}
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
                onClick={removeInvite}
              />
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      <ConfirmInviteLinkDeletion invite={invite} onClose={closeDeleteConfirmation} open={isOpen} />
    </>
  );
}

export function PublicInvitesList() {
  const isAdmin = useIsAdmin();
  const { updateInviteLinkRoles, deleteInviteLink, publicInvites } = useSpaceInvitesList();

  const publicProposalsInvite = publicInvites?.find((invite) => invite.visibleOn === 'proposals');

  const padding = 32;

  return (
    <Box overflow='auto'>
      <Table size='small' aria-label='Invite links table'>
        <TableHead>
          <TableRow sx={{ '&:first-of-type th': { borderTop: '1px solid lightgray' } }}>
            <TableCell sx={{ padding: '10px 16px' }}>Description</TableCell>
            <TableCell>Public page</TableCell>
            <TableCell sx={{ width: 150 }}>Assigned Role</TableCell>
            <TableCell sx={{ width: 90 + padding }} align='center'>
              Link
            </TableCell>
            <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {publicProposalsInvite && (
            <InviteRow
              invite={publicProposalsInvite as InviteLinkWithRoles & { visibleOn: PublicInviteLinkContext }}
              deleteInviteLink={deleteInviteLink}
              isAdmin={isAdmin}
              updateInviteLinkRoles={updateInviteLinkRoles}
            />
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

function getInviteLink(code: string) {
  return `${window.location.origin}/invite/${code}`;
}
