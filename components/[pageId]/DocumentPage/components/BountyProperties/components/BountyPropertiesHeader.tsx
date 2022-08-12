import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import { BountyWithDetails } from 'models';
import BountyStatusBadge from 'components/bounties/components/BountyStatusBadge';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { BountyPermissions } from 'lib/bounties';
import { PagePermission } from '@prisma/client';
import { compareBountyPagePermissions } from 'lib/permissions/compare';
import { BountyPagePermissionIntersection } from 'lib/permissions/interfaces';
import useRoles from 'hooks/useRoles';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useState } from 'react';

/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  bounty: BountyWithDetails,
  bountyPermissions?: Partial<BountyPermissions>,
  pagePermissions?: PagePermission[]
}

export default function BountyPropertiesHeader ({ bounty, bountyPermissions, pagePermissions }: Props) {

  const { roleups } = useRoles();
  const { pages, setPages, currentPageId } = usePages();
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const intersection: BountyPagePermissionIntersection = (!bountyPermissions || !pagePermissions || !roleups)
    ? { hasPermissions: [], missingPermissions: [] } : compareBountyPagePermissions({
      bountyPermissions,
      pagePermissions,
      bountyOperations: ['work'],
      pageOperations: ['edit_content'],
      roleups
    });

  function restrictPermissions () {
    setUpdatingPermissions(true);
    charmClient.restrictPagePermissions({
      pageId: currentPageId
    }).then(page => {
      setPages({
        ...pages,
        [page.id]: page
      });
      showMessage('Page permissions updated', 'success');
    })
      .finally(() => setUpdatingPermissions(false));
  }

  return (
    <Grid container gap={2}>
      {/* Bounty price and status  */}
      <Grid container item xs={12}>
        <Grid item xs={8}>
          <Typography fontWeight='bold'>Bounty information</Typography>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{
            justifyContent: 'flex-end',
            gap: 1,
            display: 'flex',
            alignItems: 'center'
          }}
          >

            {/* Provide the bounty menu options */}
            <Box display='flex'>
              <BountyStatusBadge
                bounty={bounty}
                truncate
              />
            </Box>

          </Box>
        </Grid>

      </Grid>

      {/* Warning for applicants */}
      {
        intersection.hasPermissions.length > 0 && (
          <Grid container item xs={12} mb={2}>
            <Grid item xs={8}>
              <Alert severity='info' sx={{ width: '90%' }}>
                The current page permissions allow applicants to edit the details of this bounty.
              </Alert>
            </Grid>

            <Grid item xs={4} display='flex' flexDirection='column' justifyContent='center'>
              <Button onClick={restrictPermissions} loading={updatingPermissions}>
                Restrict editing
              </Button>

              <Typography variant='caption'>
                Update this bounty's page permissions to view-only (except the bounty creator).
              </Typography>

            </Grid>
          </Grid>
        )
      }

    </Grid>
  );
}
