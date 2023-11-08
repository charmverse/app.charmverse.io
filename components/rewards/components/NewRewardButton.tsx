import { Button } from 'components/common/Button';
import { NewPageDocument } from 'components/common/PageDialog/components/NewPageDocument';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewRewardPage } from 'components/rewards/hooks/useNewRewardPage';

export function NewRewardButton() {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearFormInputs, contentUpdated, formInputs, setFormInputs, createReward, isSavingReward } = useNewRewardPage(
    { isDirty, newPageValues, clearNewPage }
  );

  async function onClickCreate() {
    openNewPage();
  }

  return (
    <>
      <Button data-test='create-suggest-bounty' onClick={onClickCreate}>
        Create
      </Button>

      <NewPageDialog
        contentUpdated={contentUpdated}
        isOpen={!!newPageValues}
        onClose={clearFormInputs}
        onSave={createReward}
        isSaving={isSavingReward}
      >
        <NewPageDocument pageType='bounty' readOnly={false} values={newPageValues!} onChange={updateNewPageValues}>
          <RewardPropertiesForm onChange={setFormInputs} values={formInputs} />
        </NewPageDocument>
      </NewPageDialog>
    </>
  );
}
