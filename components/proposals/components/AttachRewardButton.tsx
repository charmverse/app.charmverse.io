import { v4 } from 'uuid';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import type { ProposalDraftReward } from 'lib/proposal/blocks/interfaces';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

export function AttachRewardButton({
  onSave,
  reviewers,
  assignedSubmitters,
  readOnly
}: {
  onSave: (draftReward: ProposalDraftReward) => void;
  reviewers: RewardReviewer[];
  assignedSubmitters: string[];
  readOnly: boolean;
}) {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();

  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
  }

  function createNewReward() {
    clearRewardValues();
    setRewardValues({ reviewers, assignedSubmitters });

    openNewPage({
      type: 'bounty'
    });
  }

  async function saveForm() {
    onSave({ reward: rewardValues, page: newPageValues, draftId: v4() });
    closeDialog();
  }

  if (readOnly) {
    return null;
  }

  return (
    <>
      <AddAPropertyButton onClick={createNewReward}>+ Add a reward</AddAPropertyButton>

      <NewPageDialog
        contentUpdated={contentUpdated || isDirty}
        disabledTooltip={getDisabledTooltip({ newPageValues, rewardValues })}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        onCancel={closeDialog}
        isSaving={isSavingReward}
      >
        <NewDocumentPage
          titlePlaceholder='Reward title (required)'
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            isTemplate={false}
            expandedByDefault
            forcedApplicationType='assigned'
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}

export function getDisabledTooltip({
  newPageValues,
  rewardValues
}: {
  newPageValues: NewPageValues | null;
  rewardValues: UpdateableRewardFields;
}) {
  let disabledTooltip: string | undefined;
  if (!newPageValues?.title) {
    disabledTooltip = 'Page title is required';
  } else if (!rewardValues.reviewers?.length) {
    disabledTooltip = 'Reviewer is required';
  } else if (
    !rewardValues.customReward &&
    (!rewardValues.rewardToken || !rewardValues.rewardAmount || !rewardValues.chainId)
  ) {
    disabledTooltip = 'Reward is required';
  } else if (rewardValues.assignedSubmitters && rewardValues.assignedSubmitters.length === 0) {
    disabledTooltip = 'You need to assign at least one submitter';
  }

  return disabledTooltip;
}
