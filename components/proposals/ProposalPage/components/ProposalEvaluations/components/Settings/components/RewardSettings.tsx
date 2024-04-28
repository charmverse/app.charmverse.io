import { Box, FormLabel, Typography } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { getAbsolutePath } from 'lib/utils/browser';

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
  // when we are ready to offer this option with a modal inside the page
  options.push({
    id: 'add_new',
    name: '+ Add New',
    color: 'gray',
    variant: 'plain'
  });
  const { space } = useCurrentSpace();
  function onChangeSettings(updates: Partial<RewardOptions>) {
    onChange({ ...value, ...updates });
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
              const absolutePath = space ? getAbsolutePath('/rewards/new?type=template', space.domain) : '';
              window.open(absolutePath, '_blank');
            } else if (typeof rewardsTemplateId === 'string') {
              onChangeSettings({ rewardsTemplateId: rewardsTemplateId ?? null });
            }
          }}
        />
      </Box>
    </>
  );
}
