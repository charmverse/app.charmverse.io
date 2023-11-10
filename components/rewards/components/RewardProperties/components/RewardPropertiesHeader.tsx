import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { ExpandableSectionTitle } from 'components/common/ExpandableSectionTitle';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Reward } from 'lib/rewards/interfaces';

import { RewardStatusBadge } from '../../RewardStatusBadge';
/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  reward: Reward;
  pageId: string;
  readOnly?: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
  refreshPermissions: () => void;
}

export function RewardPropertiesHeader({
  readOnly = false,
  reward,
  isExpanded,
  pageId,
  toggleExpanded,
  refreshPermissions
}: Props) {
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const { isFreeSpace } = useIsFreeSpace();

  const { data: editableCheck } = useSWR(!isFreeSpace && reward.id ? `bounty-editable-${reward.id}` : null, () =>
    charmClient.rewards.isRewardEditable(reward.id)
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
      <Grid container mb={1}>
        <Grid item xs={6}>
          <ExpandableSectionTitle title='Reward details' isExpanded={isExpanded} toggleExpanded={toggleExpanded} />
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
              <RewardStatusBadge reward={reward} truncate showEmptyStatus />
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
