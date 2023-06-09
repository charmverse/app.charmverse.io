import type { User } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import styled from '@emotion/styled';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsPublicSpace } from 'hooks/useIsPublicSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import { getAbsolutePath } from 'lib/utilities/browser';

type Props = {
  showOpenSettingsLink?: boolean;
};

export function TogglePublicProposalsInvite({ showOpenSettingsLink }: Props) {
  const isAdmin = useIsAdmin();

  const { onClick: openSpaceSettings } = useSettingsDialog();

  const {
    isOpen,
    close: closeConfirmDeleteModal,
    open: openConfirmDeleteModal
  } = usePopupState({ variant: 'popover', popupId: 'share-proposals' });

  // Current values of the public permission
  const { deleteInviteLink, publicInvites, createInviteLink } = useSpaceInvitesList();

  const publicProposalInvite = publicInvites?.find((invite) => invite.publicContext === 'proposals');
  const publicInviteExists = !!publicProposalInvite;

  function togglePublicInvite() {
    if (publicInviteExists && publicProposalInvite.roleIds.length === 0) {
      deleteInviteLink(publicProposalInvite.id);
    } else if (publicInviteExists) {
      openConfirmDeleteModal();
      // Show confirmation dialog
    } else {
      createInviteLink({ publicContext: 'proposals' });
    }
  }

  return (
    <Grid container>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography>
            Show public invite link{' '}
            {publicInviteExists && showOpenSettingsLink && (
              <Tooltip title='Customise link roles in the settings'>
                <LaunchIcon onClick={() => openSpaceSettings('invites')} sx={{ fontSize: 14, ml: 1 }} />
              </Tooltip>
            )}
          </Typography>
        </Grid>
        <Grid item>
          <Switch checked={publicInviteExists} disabled={!isAdmin} onChange={togglePublicInvite} />
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='body2' color='secondary'>
          {publicInviteExists
            ? 'Anyone can join your space from the proposals page via a public invite link'
            : 'Users can see proposals, but cannot join your space.'}
        </Typography>
      </Grid>
      <ConfirmDeleteModal
        title='Confirm delete'
        question={`This invite link has ${publicProposalInvite?.roleIds.length} ${stringUtils.conditionalPlural({
          word: 'role',
          count: publicProposalInvite?.roleIds.length ?? 0
        })} attached. Are you sure you want to delete it?`}
        open={isOpen}
        onClose={closeConfirmDeleteModal}
        onConfirm={() => deleteInviteLink(publicProposalInvite?.id as string)}
        buttonText='Delete invite'
      />
    </Grid>
  );
}
