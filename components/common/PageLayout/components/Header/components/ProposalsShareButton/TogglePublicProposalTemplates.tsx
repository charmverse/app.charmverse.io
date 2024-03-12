import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import charmClient from 'charmClient';
import Loader from 'components/common/Loader';
import { ConfirmInviteLinkDeletion } from 'components/settings/invites/components/InviteLinks/components/ConfirmInviteLinkDeletion';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

type Props = {
  showOpenSettingsLink?: boolean;
};

export function TogglePublicProposalTemplates() {
  const isAdmin = useIsAdmin();

  const { openSettings } = useSettingsDialog();

  const { refreshCurrentSpace, space } = useCurrentSpace();

  const {
    isOpen,
    close: closeConfirmDeleteModal,
    open: openConfirmDeleteModal
  } = usePopupState({ variant: 'popover', popupId: 'proposals-toggle' });

  // Current values of the public permission
  const { deleteInviteLink, publicInvites, createInviteLink, isLoadingInvites } = useSpaceInvitesList();

  async function togglePublicProposalTemplates() {
    if (space?.publicProposalTemplates) {
      await charmClient.spaces.setPublicProposalTemplates({
        publicProposalTemplates: false,
        spaceId: space.id
      });
    } else {
      await charmClient.spaces.setPublicProposalTemplates({
        publicProposalTemplates: true,
        spaceId: space?.id as string
      });
    }

    refreshCurrentSpace();
  }

  const publicProposalTemplates = !!space?.publicProposalTemplates;

  return (
    <Grid container>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography display='flex' justifyContent='center'>
            Public proposal templates
          </Typography>
        </Grid>
        <Grid item>
          <Switch checked={publicProposalTemplates} disabled={!isAdmin} onChange={togglePublicProposalTemplates} />
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant='body2' color='secondary'>
          {publicProposalTemplates
            ? 'Anyone can view your proposal templates'
            : 'Only space members can view proposal templates'}
        </Typography>
      </Grid>
    </Grid>
  );
}
