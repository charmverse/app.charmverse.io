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
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyWithDetails, BountyPermissions } from 'lib/bounties';
import type { BountyPagePermissionIntersection } from 'lib/permissions/compareBountyPagePermissions';
import { compareBountyPagePermissions } from 'lib/permissions/compareBountyPagePermissions';
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
}

export function BountyPropertiesHeader({
  readOnly = false,
  bounty,
  bountyPermissions,
  pagePermissions,
  pageId
}: Props) {
  const { members } = useMembers();
  const { mutatePage } = usePages();
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const intersection: BountyPagePermissionIntersection =
    !bountyPermissions || !pagePermissions
      ? { hasPermissions: [], missingPermissions: [] }
      : compareBountyPagePermissions({
          bountyPermissions,
          pagePermissions,
          bountyOperations: ['work'],
          pageOperations: ['edit_content'],
          members
        });

  function restrictPermissions() {
    setUpdatingPermissions(true);
    charmClient
      .restrictPagePermissions({
        pageId
      })
      .then((page) => {
        mutatePage(page);
        showMessage('Page permissions updated', 'success');
      })
      .finally(() => setUpdatingPermissions(false));
  }

  return (
    <>
      {/* Bounty price and status  */}
      <Grid container mb={2}>
        <Grid item xs={8}>
          <Typography fontWeight='bold'>Bounty information</Typography>
        </Grid>
        <Grid item xs={4}>
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
      {intersection.hasPermissions.length > 0 && !readOnly && (
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
          The current permissions allow applicants to edit the details of this bounty.
        </Alert>
      )}
    </>
  );
}
