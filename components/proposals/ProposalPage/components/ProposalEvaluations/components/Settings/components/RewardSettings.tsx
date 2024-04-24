import { Box, Typography, FormLabel } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { MilestonePropertiesForm } from 'components/rewards/components/RewardProperties/MilestonePropertiesForm';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';

type RewardOptions = Pick<ProposalFields, 'rewardsTemplateId' | 'enableRewards'>;

export type RewardSettingsProps = {
  value: RewardOptions | null | undefined;
  onChange: (value: RewardOptions) => void;
};

export function RewardSettings({ value, onChange }: RewardSettingsProps) {
  const { templates = [] } = useRewardTemplates();
  const options: SelectOptionType[] = templates.map((template) => ({
    id: template.page.id,
    name: template.page.title,
    color: 'default'
  }));
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();
  // when we are ready to offer this option with a modal inside the page
  options.push({
    id: 'add_new',
    name: '+ Add New',
    color: 'gray',
    variant: 'plain'
  });

  function onChangeSettings(updates: Partial<RewardOptions>) {
    onChange({ ...value, ...updates });
  }

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
  }

  const errors = getRewardErrors({
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    page: {
      title: newPageValues?.title || '',
      type: newPageValues?.type || 'bounty'
    }
  });
  const disabledTooltip = errors.join(', ');

  async function saveForm() {
    const createdReward = await createReward(newPageValues);
    if (createdReward) {
      onChange({
        rewardsTemplateId: createdReward.id,
        enableRewards: true
      });
      closeDialog();
    }
  }

  return (
    <>
      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Template
        </Typography>
      </FormLabel>

      <Box display='flex' flex={1} flexDirection='column'>
        <SelectField
          includeSelectedOptions
          placeholder='No template required'
          value={value?.rewardsTemplateId || ''}
          options={options}
          onChange={async (rewardsTemplateId: string | string[]) => {
            if (rewardsTemplateId === 'add_new') {
              openNewPage({
                type: 'bounty_template'
              });
            } else if (typeof rewardsTemplateId === 'string') {
              onChangeSettings({ rewardsTemplateId: rewardsTemplateId ?? null });
            }
          }}
        />
      </Box>

      <NewPageDialog
        contentUpdated={contentUpdated || isDirty}
        disabledTooltip={disabledTooltip}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        isSaving={isSavingReward}
      >
        <NewDocumentPage
          key={newPageValues?.templateId}
          titlePlaceholder='Title (required)'
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <MilestonePropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isTemplate
            isProposalTemplate
            expandedByDefault
            selectTemplate={() => {}}
            templateId={newPageValues?.templateId}
          />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}
