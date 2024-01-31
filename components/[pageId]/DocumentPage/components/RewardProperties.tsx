import { Divider, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { useGetPermissions } from 'charmClient/hooks/permissions';
import { RewardApplications } from 'components/rewards/components/RewardApplications/RewardApplications';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardWithUsersAndPageMeta, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import debouncePromise from 'lib/utilities/debouncePromise';

import { RewardSignupButton } from '../../../rewards/components/RewardProperties/components/RewardSignupButton';

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

  const debouncedUpdateReward = useMemo(() => debouncePromise(updateReward, 500), [updateReward]);

  const readOnly = parentReadOnly || !isSpaceMember || props.readOnly;

  async function applyRewardUpdates(updates: Partial<UpdateableRewardFields>) {
    if (readOnly) {
      return;
    }

    setCurrentReward((_currentReward) => ({ ...(_currentReward as RewardWithUsers), ...updates }));
    if (currentReward?.id) {
      debouncedUpdateReward({ rewardId: currentReward.id, updateContent: updates }).then(() => {
        rewardChanged?.();
      });
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
        values={currentReward}
        onChange={applyRewardUpdates}
        readOnly={readOnly}
        expandedByDefault={expandedRewardProperties}
        templateId={templateId}
        isTemplate={isTemplate}
        readOnlyTemplate={readOnlyTemplate}
        // templates are not enabled for existing pages
        selectTemplate={() => {}}
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
