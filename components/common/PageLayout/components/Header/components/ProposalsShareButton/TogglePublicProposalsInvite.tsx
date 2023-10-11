import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import Loader from 'components/common/Loader';
import { ConfirmInviteLinkDeletion } from 'components/settings/invites/components/InviteLinks/components/ConfirmInviteLinkDeletion';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

type Props = {
  showOpenSettingsLink?: boolean;
};

export function TogglePublicProposalsInvite({ showOpenSettingsLink }: Props) {
  const isAdmin = useIsAdmin();

  const { openSettings } = useSettingsDialog();

  const {
    isOpen,
    close: closeConfirmDeleteModal,
    open: openConfirmDeleteModal
  } = usePopupState({ variant: 'popover', popupId: 'proposals-toggle' });

  // Current values of the public permission
  const { deleteInviteLink, publicInvites, createInviteLink, isLoadingInvites } = useSpaceInvitesList();

  const publicProposalInvite = publicInvites?.find((invite) => invite.visibleOn === 'proposals');
  const publicInviteExists = !!publicProposalInvite;

  function togglePublicInvite() {
    if (publicInviteExists && publicProposalInvite.roleIds.length === 0) {
      deleteInviteLink(publicProposalInvite.id);
    } else if (publicInviteExists) {
      openConfirmDeleteModal();
      // Show confirmation dialog
    } else {
      createInviteLink({ visibleOn: 'proposals' });
    }
  }

  if (isLoadingInvites && !publicInvites) {
    return <Loader size={20} />;
  }

  return (
    <Grid container>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography display='flex' justifyContent='center'>
            Show public invite link{' '}
            {publicInviteExists && showOpenSettingsLink && (
              <Tooltip title='Customise link roles in the settings'>
                <SettingsIcon onClick={() => openSettings('invites')} sx={{ fontSize: 14, margin: 'auto', ml: 0.5 }} />
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

      {publicProposalInvite && (
        <ConfirmInviteLinkDeletion open={isOpen} onClose={closeConfirmDeleteModal} invite={publicProposalInvite} />
      )}
    </Grid>
  );
}
