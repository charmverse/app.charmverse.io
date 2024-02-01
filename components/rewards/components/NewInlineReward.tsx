import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePages } from 'hooks/usePages';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';

export function NewInlineReward({ pageId }: { pageId: string }) {
  const { clearRewardValues, rewardValues, setRewardValues, createReward, isSavingReward } = useNewReward();
  const { setCreatingInlineReward } = useRewards();
  const { refreshPage } = usePages();
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  async function saveForm() {
    const success = await createReward({ linkedPageId: pageId });
    if (success) {
      clearRewardValues();
      setCreatingInlineReward(false);
      refreshPage(pageId);
    }
  }

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      setRewardValues(template.reward);
      setSelectedTemplate(template.page.id);
    } else {
      setSelectedTemplate(undefined);
    }
  }

  useEffect(() => {
    return () => setCreatingInlineReward(false);
  }, []);

  return (
    <Stack gap={1} key={selectedTemplate}>
      <RewardPropertiesForm
        templateId={selectedTemplate}
        selectTemplate={selectTemplate}
        onChange={setRewardValues}
        values={rewardValues}
        expandedByDefault
        isNewReward
      />
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
