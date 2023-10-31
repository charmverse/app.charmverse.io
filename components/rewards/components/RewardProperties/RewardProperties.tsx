import { Box, Divider, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useGetPermissions } from 'charmClient/hooks/permissions';
import { useGetReward } from 'charmClient/hooks/rewards';
import { RewardApplications } from 'components/rewards/components/RewardApplications/RewardApplications';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { RewardSignupButton } from './components/RewardSignupButton';

export function RewardProperties(props: {
  readOnly?: boolean;
  rewardId: string | null;
  pageId: string;
  pagePath: string;
  rewardChanged?: () => void;
  onClose?: () => void;
}) {
  const { rewardId, pageId, readOnly: parentReadOnly = false, rewardChanged, onClose } = props;
  const { updateReward, refreshReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<Partial<RewardCreationData & RewardWithUsers> | null>();

  const { data: initialReward } = useGetReward({
    rewardId: rewardId as string
  });

  useEffect(() => {
    if (!currentReward && initialReward) {
      setCurrentReward(initialReward as any);
    }
  }, [initialReward]);

  const { data: rewardPagePermissions, mutate: refreshPagePermissionsList } = useGetPermissions(pageId);
  const { isSpaceMember } = useIsSpaceMember();

  async function resyncReward() {
    const _rewardId = currentReward?.id;
    if (_rewardId) {
      const updated = await refreshReward(_rewardId);
      setCurrentReward({ ...currentReward, ...updated });
      rewardChanged?.();
    }
  }

  const readOnly = parentReadOnly || !isSpaceMember || props.readOnly;

  async function applyRewardUpdates(updates: Partial<UpdateableRewardFields>) {
    if (readOnly) {
      return;
    }

    setCurrentReward((_currentReward) => ({ ...(_currentReward as RewardWithUsers), ...updates }));

    if (currentReward?.id) {
      await updateReward({ rewardId: currentReward.id, updateContent: updates });
      resyncReward();
    }
  }

  if (!currentReward) {
    return null;
  }

  return (
    <Stack mt={2} flex={1}>
      <RewardPropertiesForm
        pageId={pageId}
        refreshPermissions={refreshPagePermissionsList}
        useDebouncedInputs
        values={currentReward}
        onChange={applyRewardUpdates}
        readOnly={readOnly}
      />

      {!!currentReward?.id && <RewardApplications rewardId={currentReward.id} onShowApplication={onClose} />}

      <Divider
        sx={{
          my: 1
        }}
      />

      {!isSpaceMember && <RewardSignupButton pagePath={props.pagePath} />}
    </Stack>
  );
}
