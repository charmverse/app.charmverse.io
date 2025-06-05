import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

type Props = {
  showOpenSettingsLink?: boolean;
};

export function TogglePublicProposalTemplates() {
  const isAdmin = useIsAdmin();

  const { refreshCurrentSpace, space } = useCurrentSpace();

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
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid>
          <Typography display='flex' justifyContent='center'>
            Public proposal templates
          </Typography>
        </Grid>
        <Grid>
          <Switch checked={publicProposalTemplates} disabled={!isAdmin} onChange={togglePublicProposalTemplates} />
        </Grid>
      </Grid>
      <Grid>
        <Typography variant='body2' color='secondary'>
          {publicProposalTemplates
            ? 'Anyone can view your proposal templates'
            : 'Only space members can view proposal templates'}
        </Typography>
      </Grid>
    </Grid>
  );
}
