import { log } from '@charmverse/core/log';
import { useCallback, useState } from 'react';

import { useCreateReward } from 'charmClient/hooks/rewards';
import { EMPTY_PAGE_VALUES } from 'components/common/PageDialog/hooks/useNewPage';
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
  const { trigger: createRewardTrigger } = useCreateReward();

  const setRewardValues = useCallback((partialFormInputs: Partial<UpdateableRewardFields>) => {
    setContentUpdated(true);
    setRewardValuesRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
  }, []);

  const clearRewardValues = useCallback(() => {
    setRewardValuesRaw(emptyState());
    setContentUpdated(false);
  }, []);

  const createReward = useCallback(
    async (pageValues: (RewardPageProps & { linkedPageId?: string }) | null) => {
      pageValues ||= EMPTY_PAGE_VALUES;
      log.info('[user-journey] Create a reward');
      if (currentSpace) {
        setIsSaving(true);

        const createdReward = await createRewardTrigger({
          pageProps: pageValues?.linkedPageId
            ? undefined
            : {
                content: pageValues.content,
                contentText: pageValues.contentText ?? '',
                title: pageValues.title,
                sourceTemplateId: pageValues.sourceTemplateId,
                headerImage: pageValues.headerImage,
                icon: pageValues.icon,
                type: pageValues.type
              },
          ...rewardValues,
          linkedPageId: pageValues.linkedPageId,
          spaceId: currentSpace.id
        })
          .catch((err: any) => {
            showMessage(err.message ?? 'Something went wrong', 'error');
            throw err;
          })
          .then((reward) => {
            setContentUpdated(false);
            return reward;
          })
          .finally(() => {
            setIsSaving(false);
          });

        return createdReward;
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
    ...inputs
  };
}
