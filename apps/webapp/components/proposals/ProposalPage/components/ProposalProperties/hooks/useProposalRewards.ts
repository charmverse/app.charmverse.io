import type { ProposalReviewer } from '@charmverse/core/prisma-client';
import { uniqBy } from 'lodash';
import { useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import type { ProposalPendingReward } from '@packages/lib/proposals/interfaces';
import { getRewardErrors } from '@packages/lib/rewards/getRewardErrors';
import type { RewardTemplate } from '@packages/lib/rewards/getRewardTemplate';

export function useProposalRewards({
  isProposalTemplate,
  assignedSubmitters,
  reviewers,
  onSave,
  requiredTemplateId
}: {
  isProposalTemplate?: boolean;
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  assignedSubmitters: string[];
  onSave: (reward: ProposalPendingReward) => void;
  requiredTemplateId?: string | null;
}) {
  const [currentPendingId, setCurrentPendingId] = useState<null | string>(null);
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { templates } = useRewardTemplates({ load: !!requiredTemplateId });

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
    setCurrentPendingId(null);
  }

  async function saveForm() {
    if (newPageValues) {
      onSave({ reward: rewardValues, page: newPageValues, draftId: currentPendingId || '' });
      closeDialog();
    }
  }

  const rewardReviewers = useMemo(() => {
    return uniqBy(reviewers, (reviewer) => reviewer.userId || reviewer.roleId);
  }, [reviewers]);

  const newRewardErrors = getRewardErrors({
    page: newPageValues,
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    isMilestone: true,
    isProposalTemplate
  }).join(', ');

  function getTemplateAppliedReward(template?: RewardTemplate) {
    const rewardType = template ? template.rewardType : 'token';
    return {
      rewardType,
      fields: template?.fields,
      selectedCredentialTemplates: template?.selectedCredentialTemplates,
      chainId: rewardType === 'token' ? template?.chainId : null,
      customReward: rewardType === 'custom' ? template?.customReward : null,
      rewardAmount: rewardType === 'token' ? template?.rewardAmount : null,
      rewardToken: rewardType === 'token' ? template?.rewardToken : null,
      dueDate: template?.dueDate,
      reviewers: rewardReviewers,
      assignedSubmitters,
      // Converting reward values to be of assigned workflow
      approveSubmitters: false,
      allowMultipleApplications: false,
      allowedSubmitterRoles: [],
      maxSubmissions: null
    };
  }

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      setRewardValues(getTemplateAppliedReward(template));
      updateNewPageValues({
        ...template.page,
        content: template.page.content as any,
        title: undefined,
        type: 'bounty',
        templateId: template.page.id
      });
    } else {
      updateNewPageValues({
        templateId: undefined
      });
    }
  }

  function createNewReward() {
    clearRewardValues();
    const template = templates?.find((t) => t.page.id === requiredTemplateId);
    setRewardValues(getTemplateAppliedReward(template), { skipDirty: true });

    openNewPage({
      ...template?.page,
      content: template?.page.content as any,
      templateId: requiredTemplateId || undefined,
      title: undefined,
      type: 'bounty'
    });
    // set a new draftId
    setCurrentPendingId(v4());
  }

  function showReward({ reward, page, draftId }: ProposalPendingReward) {
    setRewardValues(reward);
    openNewPage(page || undefined);
    setCurrentPendingId(draftId);
  }

  return {
    newRewardErrors,
    selectTemplate,
    saveForm,
    createNewReward,
    closeDialog,
    newPageValues,
    setRewardValues,
    updateNewPageValues,
    isDirty,
    contentUpdated,
    isSavingReward,
    openNewPage,
    showReward,
    rewardValues,
    setCurrentPendingId,
    currentPendingId
  };
}
