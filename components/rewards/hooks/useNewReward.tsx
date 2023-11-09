import { log } from '@charmverse/core/log';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

import { EMPTY_PAGE_VALUES } from 'components/common/PageDialog/hooks/useNewPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import type { RewardPageProps } from 'lib/rewards/createReward';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export function useNewReward() {
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { showPage } = usePageDialog();
  const router = useRouter();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rewardValues, setRewardValuesRaw] = useState<UpdateableRewardFields>(emptyState());
  const { createReward: createRewardTrigger, mutateRewards } = useRewards();

  const setRewardValues = useCallback((partialFormInputs: Partial<UpdateableRewardFields>) => {
    setContentUpdated(true);
    setRewardValuesRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
  }, []);

  const clearRewardValues = useCallback(() => {
    setRewardValuesRaw(emptyState());
    setContentUpdated(false);
  }, [setRewardValues]);

  const createReward = useCallback(
    async (pageValues: (RewardPageProps & { linkedPageId?: string }) | null) => {
      pageValues ||= EMPTY_PAGE_VALUES;
      log.info('[user-journey] Create a proposal');
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
          .finally(() => {
            setIsSaving(false);
          });

        if (createdReward) {
          mutateRewards();
          showPage({
            pageId: createdReward.id,
            onClose() {
              setUrlWithoutRerender(router.pathname, { id: null });
            }
          });
          setUrlWithoutRerender(router.pathname, { id: createdReward.id });
          setContentUpdated(false);
          return createdReward;
        }
      }
    },
    [createRewardTrigger, rewardValues, currentSpace, mutateRewards, router.pathname, showMessage, showPage]
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
