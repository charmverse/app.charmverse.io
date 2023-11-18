import { Stack } from '@mui/material';
import { useEffect } from 'react';

import { Button } from 'components/common/Button';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePages } from 'hooks/usePages';

export function NewInlineReward({ pageId }: { pageId: string }) {
  const { clearRewardValues, rewardValues, setRewardValues, createReward, isSavingReward } = useNewReward();
  const { setCreatingInlineReward } = useRewards();
  const { refreshPage } = usePages();

  function resetForm() {
    clearRewardValues();
  }

  async function saveForm() {
    const newReward = await createReward({ linkedPageId: pageId });
    if (newReward) {
      resetForm();
      setCreatingInlineReward(false);
      refreshPage(pageId);
    }
  }

  useEffect(() => {
    return () => setCreatingInlineReward(false);
  }, []);

  return (
    <Stack gap={1}>
      <RewardPropertiesForm onChange={setRewardValues} values={rewardValues} expandedByDefault isNewReward />
      <Stack direction='row' alignItems='center' justifyContent='flex-end' flex={1} gap={1}>
        <Button onClick={() => setCreatingInlineReward(false)} variant='outlined' color='secondary'>
          Cancel
        </Button>

        <Button onClick={saveForm} disabled={isSavingReward} loading={isSavingReward}>
          Confirm reward
        </Button>
      </Stack>
    </Stack>
  );
}
