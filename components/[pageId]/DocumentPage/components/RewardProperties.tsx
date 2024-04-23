import type { BountyStatus } from '@charmverse/core/prisma';
import { Divider, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { RewardApplications } from 'components/rewards/components/RewardApplications/RewardApplications';
import { RewardSignupButton } from 'components/rewards/components/RewardProperties/components/RewardSignupButton';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { RewardPropertiesFormV2 } from 'components/rewards/components/RewardProperties/RewardPropertiesFormV2';
import type { UpdateableRewardFieldsWithType } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardWithUsersAndPageMeta } from 'lib/rewards/interfaces';
import debouncePromise from 'lib/utils/debouncePromise';

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
  const isCharmverseSpace = useIsCharmverseSpace();
  const { updateReward } = useRewards();
  const [currentReward, setCurrentReward] = useState<RewardsValue | undefined>();
  useEffect(() => {
    if (initialReward) {
      setCurrentReward({
        ...initialReward,
        rewardType: getRewardType(initialReward)
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
      {isCharmverseSpace ? (
        <RewardPropertiesFormV2 {...rewardPropertiesFormProps} />
      ) : (
        <RewardPropertiesForm {...rewardPropertiesFormProps} />
      )}

      {!isTemplate && (
        <>
          {!!currentReward?.id && showApplications && initialReward?.status !== 'draft' && (
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
