import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import charmClient from 'charmClient';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import Button from 'components/common/Button';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyPermissions, BountyWithDetails } from 'lib/bounties';
import { isBountyEditableByApplicants } from 'lib/permissions/bounties/isBountyEditableByApplicants';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';

/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  bounty: BountyWithDetails;
  bountyPermissions?: Partial<BountyPermissions>;
  pagePermissions?: PagePermissionMeta[];
  pageId: string;
  readOnly?: boolean;
  refreshPermissions: () => void;
}

export function BountyPropertiesHeader({
  readOnly = false,
  bounty,
  bountyPermissions,
  pagePermissions,
  pageId,
  refreshPermissions
}: Props) {
  const { members } = useMembers();
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  // Detect if the page permissions allow potential applicants to edit the page
  const editableByCertainApplicants = isBountyEditableByApplicants({
    bountyPermissions: bountyPermissions ?? {},
    pagePermissions: pagePermissions ?? [],
    members,
    bounty
  });

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
      {editableByCertainApplicants && !readOnly && (
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
