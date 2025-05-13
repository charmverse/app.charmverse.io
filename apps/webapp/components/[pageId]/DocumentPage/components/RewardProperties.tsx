import type { BountyStatus } from '@charmverse/core/prisma';
import { Divider, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { RewardApplications } from 'components/rewards/components/RewardApplications/RewardApplications';
import { RewardSignupButton } from 'components/rewards/components/RewardProperties/components/RewardSignupButton';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import type { UpdateableRewardFieldsWithType } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import type { RewardWithUsersAndPageMeta } from '@packages/lib/rewards/interfaces';
import debouncePromise from '@packages/lib/utils/debouncePromise';

type RewardsValue = UpdateableRewardFieldsWithType & { id?: string; status?: BountyStatus };

export function RewardProperties(props: {
  readOnly?: boolean;
  reward?: RewardWithUsersAndPageMeta;
  pageId: string;
  pagePath: string;
  rewardChanged?: () => void;
  showApplications?: boolean;
  isTemplate?: boolean;
  expandedRewardProperties?: boolean;
  templateId?: string;
  readOnlyTemplate?: boolean;
}) {
  const {
    reward: initialReward,
    pageId,
    readOnly: parentReadOnly = false,
    rewardChanged,
    showApplications,
    isTemplate,
    expandedRewardProperties,
    templateId,
    readOnlyTemplate
  } = props;
  const { updateReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<RewardsValue | undefined>();
  useEffect(() => {
    if (initialReward) {
      setCurrentReward({
        ...initialReward
      });
    }
  }, [initialReward]);

  const { isSpaceMember } = useIsSpaceMember();

  const debouncedUpdateReward = useMemo(() => debouncePromise(updateReward, 500), [updateReward]);

  const readOnly = parentReadOnly || !isSpaceMember || props.readOnly;

  async function applyRewardUpdates(updates: Partial<RewardsValue>) {
    if (readOnly) {
      return;
    }

    setCurrentReward((_currentReward) => ({ rewardType: 'token', ..._currentReward, ...updates }));
    if (currentReward?.id) {
      debouncedUpdateReward({ rewardId: currentReward.id, updateContent: updates }).then(() => {
        rewardChanged?.();
      });
    }
  }

  if (!currentReward) {
    return null;
  }

  const rewardPropertiesFormProps = {
    pageId,
    values: currentReward,
    onChange: applyRewardUpdates,
    readOnly,
    expandedByDefault: expandedRewardProperties,
    templateId,
    isTemplate,
    readOnlyTemplate,
    selectTemplate: () => {},
    rewardStatus: currentReward.status
  };

  return (
    <Stack flex={1}>
      <RewardPropertiesForm {...rewardPropertiesFormProps} />
      {!isTemplate && (
        <>
          {!!currentReward?.id && showApplications && initialReward && initialReward?.status !== 'draft' && (
            <>
              <Divider sx={{ my: 1 }} />
              <Stack>
                <RewardApplications
                  applicationRequired={currentReward.approveSubmitters ?? false}
                  reward={initialReward}
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
