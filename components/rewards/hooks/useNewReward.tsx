import { log } from '@charmverse/core/log';
import { useCallback, useState } from 'react';

import { EMPTY_PAGE_VALUES } from 'components/common/PageDialog/hooks/useNewPage';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { RewardPageProps } from 'lib/rewards/createReward';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function useNewReward() {
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rewardValues, setRewardValuesRaw] = useState<UpdateableRewardFields>(emptyState());
  const { createReward: createRewardTrigger } = useRewards();

  const setRewardValues = useCallback((partialFormInputs: Partial<UpdateableRewardFields>) => {
    setContentUpdated(true);
    setRewardValuesRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
  }, []);

  const clearRewardValues = useCallback(() => {
    setRewardValuesRaw(emptyState());
    setContentUpdated(false);
  }, []);

  const createReward = useCallback(
    async (pageValues: RewardPageProps | null) => {
      pageValues ||= EMPTY_PAGE_VALUES;
      log.info('[user-journey] Create a proposal');
      if (currentSpace) {
        setIsSaving(true);

        const createdReward = await createRewardTrigger({
          pageProps: {
            content: pageValues.content,
            contentText: pageValues.contentText ?? '',
            title: pageValues.title,
            sourceTemplateId: pageValues.sourceTemplateId,
            headerImage: pageValues.headerImage,
            icon: pageValues.icon,
            type: pageValues.type
          },
          ...rewardValues,
          spaceId: currentSpace.id
        })
          .catch((err: any) => {
            showMessage(err.message ?? 'Something went wrong', 'error');
            throw err;
          })
          .finally(() => {
            setIsSaving(false);
          });

        if (createdReward) {
          setContentUpdated(false);
          return createdReward;
        }
      }
    },
    [createRewardTrigger, rewardValues, currentSpace, showMessage]
  );

  return {
    rewardValues,
    setRewardValues,
    clearRewardValues,
    createReward,
    isSavingReward: isSaving,
    contentUpdated
  };
}

export function emptyState({
  userId,
  ...inputs
}: Partial<UpdateableRewardFields> & { userId?: string } = {}): UpdateableRewardFields {
  return {
    fields: { properties: {} },
    chainId: 1,
    rewardAmount: 1,
    rewardToken: 'ETH',
    ...inputs
  };
}
