import { Divider, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetPermissions } from 'charmClient/hooks/permissions';
import { RewardApplications } from 'components/rewards/components/RewardApplications/RewardApplications';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsersAndPageMeta, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { RewardSignupButton } from './components/RewardSignupButton';

export function RewardProperties(props: {
  readOnly?: boolean;
  reward?: RewardWithUsersAndPageMeta;
  pageId: string;
  pagePath: string;
  rewardChanged?: () => void;
  showApplications?: boolean;
  isTemplate?: boolean;
  expandedRewardProperties?: boolean;
}) {
  const {
    reward: initialReward,
    pageId,
    readOnly: parentReadOnly = false,
    rewardChanged,
    showApplications,
    isTemplate,
    expandedRewardProperties
  } = props;
  const { updateReward, refreshReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<Partial<RewardCreationData & RewardWithUsers> | undefined>(
    initialReward
  );
  useEffect(() => {
    if (initialReward) {
      setCurrentReward(initialReward);
    }
  }, [initialReward]);

  const { mutate: refreshPagePermissionsList } = useGetPermissions(pageId);
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
    <Stack flex={1}>
      <RewardPropertiesForm
        pageId={pageId}
        refreshPermissions={refreshPagePermissionsList}
        useDebouncedInputs
        values={currentReward}
        onChange={applyRewardUpdates}
        readOnly={readOnly}
        expandedByDefault={expandedRewardProperties}
        isTemplate={isTemplate}
        rewardStatus={currentReward.status}
      />

      {!isTemplate && (
        <>
          {!!currentReward?.id && showApplications && (
            <>
              <Divider sx={{ my: 1 }} />
              <Stack>
                <RewardApplications
                  applicationRequired={currentReward.approveSubmitters ?? false}
                  rewardId={currentReward.id}
                />
              </Stack>
            </>
          )}
          {!isSpaceMember && (
            <>
              <Divider sx={{ my: 2 }} />
              <RewardSignupButton pagePath={props.pagePath} />
            </>
          )}
          <Divider sx={{ my: 1 }} />
        </>
      )}
    </Stack>
  );
}
