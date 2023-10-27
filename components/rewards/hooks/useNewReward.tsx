import { log } from '@charmverse/core/log';
import { useRouter } from 'next/router';
import { use, useCallback, useEffect, useState } from 'react';
import { mutate } from 'swr';

import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { RewardPageAndPropertiesInput } from 'lib/rewards/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Props = {
  initValues?: Partial<RewardPageAndPropertiesInput>;
};

export function useNewReward({ initValues }: Props = {}) {
  const { updateNewPageContext, clearNewPage, isDirty, newPageValues } = useNewPage();
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const { space: currentSpace } = useCurrentSpace();
  const { showPage } = usePageDialog();
  const { refreshPage } = usePages();
  const router = useRouter();

  const [contentUpdated, setContentUpdated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formInputs, setFormInputsRaw] = useState<RewardPageAndPropertiesInput>(
    emptyState({ ...initValues, userId: user?.id })
  );
  const { createReward: createRewardTrigger } = useRewards();

  const setFormInputs = useCallback((partialFormInputs: Partial<RewardPageAndPropertiesInput>) => {
    setContentUpdated(true);
    setFormInputsRaw((existingFormInputs) => ({ ...existingFormInputs, ...partialFormInputs }));
  }, []);

  const clearFormInputs = useCallback(() => {
    setFormInputs(emptyState());
    setContentUpdated(false);
  }, [setFormInputs]);

  const createReward = useCallback(async () => {
    log.info('[user-journey] Create a proposal');
    if (currentSpace) {
      setIsSaving(true);
      const { content, contentText, title, headerImage, icon, ...rewardProps } = formInputs;

      const createdReward = await createRewardTrigger({
        pageProps: newPageValues || {
          content: null,
          contentText: '',
          title: '',
          headerImage: null,
          icon: null
        },
        spaceId: currentSpace.id,
        ...rewardProps
      })
        .catch((err: any) => {
          showMessage(err.message ?? 'Something went wrong', 'error');
          throw err;
        })
        .finally(() => {
          setIsSaving(false);
        });

      if (createdReward) {
        refreshPage(createdReward.id);
        mutate(`/api/spaces/${currentSpace.id}/proposals`);
        showPage({
          pageId: createdReward.id,
          onClose() {
            setUrlWithoutRerender(router.pathname, { id: null });
          }
        });
        setTimeout(() => {
          clearNewPage();
          clearFormInputs();
        }, 100);
        setUrlWithoutRerender(router.pathname, { id: createdReward.id });
        setContentUpdated(false);
      }
    }
  }, [
    clearFormInputs,
    clearNewPage,
    createRewardTrigger,
    currentSpace,
    formInputs,
    newPageValues,
    refreshPage,
    router.pathname,
    showMessage,
    showPage
  ]);

  useEffect(() => {
    if (isDirty) {
      setContentUpdated(true);
    }
  }, [isDirty]);

  useEffect(() => {
    updateNewPageContext({
      contentUpdated
    });
  }, [contentUpdated, updateNewPageContext]);

  return {
    formInputs,
    setFormInputs,
    clearFormInputs,
    createReward,
    isSavingReward: isSaving,
    contentUpdated
  };
}

export function emptyState({
  userId,
  ...inputs
}: Partial<RewardPageAndPropertiesInput> & { userId?: string } = {}): RewardPageAndPropertiesInput {
  return {
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    reviewers: [],
    title: '',
    fields: { properties: {} },
    chainId: 1,
    rewardAmount: 1,
    rewardToken: 'ETH',
    ...inputs
  };
}
