import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { usePages } from 'hooks/usePages';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';

import { useRewardTemplates } from '../hooks/useRewardTemplates';

export function NewInlineReward({ pageId }: { pageId: string }) {
  const { clearRewardValues, rewardValues, setRewardValues, createReward, isSavingReward } = useNewReward();
  const { setCreatingInlineReward } = useRewards();
  const { refreshPage } = usePages();
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const { templates } = useRewardTemplates();

  function resetForm() {
    clearRewardValues();
  }

  async function saveForm() {
    const success = await createReward({ linkedPageId: pageId });
    if (success) {
      resetForm();
      setCreatingInlineReward(false);
      refreshPage(pageId);
    }
  }

  function addPageFromTemplate(templateId: string) {
    const template = templates?.find((tpl) => tpl.page.id === templateId) ?? null;
    if (template) {
      setRewardValues(template.reward);
    }
    setSelectedTemplate(templateId);
  }

  useEffect(() => {
    return () => setCreatingInlineReward(false);
  }, []);

  return (
    <Stack gap={1}>
      <RewardPropertiesForm
        templateId={selectedTemplate}
        addPageFromTemplate={addPageFromTemplate}
        onChange={setRewardValues}
        values={rewardValues}
        expandedByDefault
        isNewReward
        resetTemplate={() => setSelectedTemplate(undefined)}
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
