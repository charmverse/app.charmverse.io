import { log } from '@packages/core/log';
import type { RewardPageProps } from '@packages/lib/rewards/createReward';
import type { RewardType } from '@packages/lib/rewards/interfaces';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';
import { useCallback, useState } from 'react';

import { useCreateReward } from 'charmClient/hooks/rewards';
import { EMPTY_PAGE_VALUES } from 'components/common/PageDialog/hooks/useNewPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

export type UpdateableRewardFieldsWithType = Omit<UpdateableRewardFields, 'rewardType'> & { rewardType: RewardType };

export function useNewReward() {
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rewardValues, setRewardValuesRaw] = useState<UpdateableRewardFieldsWithType>(emptyState());
  const { trigger: createRewardTrigger } = useCreateReward();

  const setRewardValues = useCallback(
    (partialFormInputs: Partial<UpdateableRewardFields>, { skipDirty }: { skipDirty?: boolean } = {}) => {
      if (!skipDirty) {
        setContentUpdated(true);
      }
      setRewardValuesRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
    },
    []
  );

  const clearRewardValues = useCallback(() => {
    setRewardValuesRaw(emptyState());
    setContentUpdated(false);
  }, []);

  const createReward = useCallback(
    async (pageValues: (RewardPageProps & { isDraft?: boolean; linkedPageId?: string }) | null) => {
      pageValues ||= EMPTY_PAGE_VALUES;
      log.info('[user-journey] Create a reward');
      if (currentSpace) {
        setIsSaving(true);

        return createRewardTrigger({
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
          isDraft: pageValues.isDraft,
          linkedPageId: pageValues.linkedPageId,
          spaceId: currentSpace.id
        })
          .catch((err: any) => {
            showMessage(err.message ?? 'Something went wrong', 'error');
            throw err;
          })
          .then((createdReward) => {
            setContentUpdated(false);
            return createdReward ?? null;
          })
          .finally(() => {
            setIsSaving(false);
            return null;
          });
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
}: Partial<UpdateableRewardFieldsWithType> & { userId?: string } = {}): UpdateableRewardFieldsWithType {
  return {
    fields: { properties: {} },
    rewardType: 'token',
    ...inputs
  };
}
