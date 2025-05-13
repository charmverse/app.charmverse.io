import { Box, FormLabel, Switch, Typography } from '@mui/material';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';

import { SelectField } from 'components/common/form/fields/SelectField';
import { FormControlLabel } from 'components/common/form/FormControlLabel';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { getAbsolutePath } from '@packages/lib/utils/browser';

type RewardOptions = Pick<ProposalFields, 'rewardsTemplateId' | 'enableRewards' | 'makeRewardsPublic'>;

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

  const { getFeatureTitle } = useSpaceFeatures();

  const rewardLabel = getFeatureTitle('Rewards');

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
      <Box mb={1}>
        <FormControlLabel
          control={
            <Switch
              checked={!!value?.makeRewardsPublic}
              onChange={async (ev) => {
                onChangeSettings({ makeRewardsPublic: !!ev.target.checked });
              }}
            />
          }
          label={`${getFeatureTitle('Rewards')} will be publicly visible`}
        />
      </Box>
      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Template
        </Typography>
      </FormLabel>

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
    </>
  );
}
