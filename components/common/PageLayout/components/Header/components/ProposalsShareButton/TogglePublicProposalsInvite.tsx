import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

import { ConfirmPublicProposalLinkDeletion } from './ConfirmProposalDeletion';

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
  } = usePopupState({ variant: 'popover', popupId: 'proposals-toggle' });

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

      <ConfirmPublicProposalLinkDeletion open={isOpen} onClose={closeConfirmDeleteModal} />
    </Grid>
  );
}
