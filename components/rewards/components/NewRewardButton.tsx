import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

export function NewRewardButton() {
  const { openNewPage } = useNewPage();
  const { clearFormInputs, formInputs, setFormInputs, createReward, isSavingReward } = useNewReward();

  async function onClickCreate() {
    openNewPage();
  }

  return (
    <>
      <Button data-test='create-suggest-bounty' onClick={onClickCreate}>
        Create
      </Button>

      <NewPageDialog onClose={clearFormInputs} onSave={createReward} isSaving={isSavingReward}>
        <RewardPropertiesForm onChange={setFormInputs} values={formInputs} />
      </NewPageDialog>
    </>
  );
}
