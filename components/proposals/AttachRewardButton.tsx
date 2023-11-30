import { useRef } from 'react';

import { AddAPropertyButton } from 'components/common/BoardEditor/components/properties/AddAProperty';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function AttachRewardButton({ onSave }: { onSave: (values: any) => void }) {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();

  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
  }

  function createNewReward() {
    clearRewardValues();
    openNewPage({
      type: 'bounty'
    });
  }

  async function saveForm() {
    onSave({ reward: rewardValues, page: newPageValues });
    closeDialog();
  }

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

  return (
    <>
      <AddAPropertyButton onClick={createNewReward}>+ Add a reward</AddAPropertyButton>

      <NewPageDialog
        contentUpdated={contentUpdated || isDirty}
        disabledTooltip={disabledTooltip}
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
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}
