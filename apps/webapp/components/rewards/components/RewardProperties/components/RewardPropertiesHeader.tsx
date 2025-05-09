import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Reward } from '@packages/lib/rewards/interfaces';

/**
 * Permissions left optional so this component can initialise without them
 */
interface Props {
  reward: Partial<Pick<Reward, 'id' | 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'status'>>;
  pageId: string;
  readOnly?: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export function RewardPropertiesHeader({ readOnly = false, reward, isExpanded, pageId, toggleExpanded }: Props) {
  const { showMessage } = useSnackbar();

  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  const { isFreeSpace } = useIsFreeSpace();

  const { data: editableCheck, mutate: refreshEditable } = useSWR(
    !isFreeSpace && reward.id ? `bounty-editable-${reward.id}` : null,
    () => charmClient.rewards.isRewardEditable(reward.id!)
  );
  function restrictPermissions() {
    setUpdatingPermissions(true);
    charmClient
      .restrictPagePermissions({
        pageId
      })
      .then(() => {
        refreshEditable();
        showMessage('Page permissions updated. Only the bounty creator can edit this page.', 'success');
      })
      .finally(() => setUpdatingPermissions(false));
  }

  return (
    <>
      {/* Warning for reward creator */}
      {!!editableCheck?.editable && !isFreeSpace && !readOnly && (
        <Alert
          severity='info'
          sx={{ mb: 2 }}
          action={
            <Tooltip title={"Update this reward's page permissions to view-only (except for the reward creator)."}>
              <Button size='small' variant='outlined' onClick={restrictPermissions} loading={updatingPermissions}>
                Restrict editing
              </Button>
            </Tooltip>
          }
        >
          The current permissions allow some applicants to edit the details of this reward.
        </Alert>
      )}
    </>
  );
}
