import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { BountyStatusBadge } from 'components/bounties/components/BountyStatusBadge';
import { Button } from 'components/common/Button';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyWithDetails } from 'lib/bounties';

/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  bounty: BountyWithDetails;
  pageId: string;
  readOnly?: boolean;
  refreshPermissions: () => void;
}

export function BountyPropertiesHeader({ readOnly = false, bounty, pageId, refreshPermissions }: Props) {
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const { isFreeSpace } = useIsFreeSpace();

  const { data: editableCheck } = useSWR(!isFreeSpace ? `bounty-editable-${bounty.id}` : null, () =>
    charmClient.bounties.isBountyEditable(bounty.id)
  );
  function restrictPermissions() {
    setUpdatingPermissions(true);
    charmClient
      .restrictPagePermissions({
        pageId
      })
      .then(() => {
        refreshPermissions();
        showMessage('Page permissions updated. Only the bounty creator can edit this page.', 'success');
      })
      .finally(() => setUpdatingPermissions(false));
  }

  return (
    <>
      {/* Bounty price and status  */}
      <Grid container mb={2}>
        <Grid item xs={6}>
          <Typography fontWeight='bold'>Bounty information</Typography>
        </Grid>
        <Grid item xs={6}>
          <Box
            sx={{
              justifyContent: 'flex-end',
              gap: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {/* Provide the bounty menu options */}
            <Box data-test='bounty-header-amount' display='flex'>
              <BountyStatusBadge bounty={bounty} truncate />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Warning for applicants */}
      {!!editableCheck?.editable && !isFreeSpace && !readOnly && (
        <Alert
          severity='info'
          sx={{ mb: 2 }}
          action={
            <Tooltip title={"Update this bounty's page permissions to view-only (except for the bounty creator)."}>
              <Button size='small' variant='outlined' onClick={restrictPermissions} loading={updatingPermissions}>
                Restrict editing
              </Button>
            </Tooltip>
          }
        >
          The current permissions allow some applicants to edit the details of this bounty.
        </Alert>
      )}
    </>
  );
}
