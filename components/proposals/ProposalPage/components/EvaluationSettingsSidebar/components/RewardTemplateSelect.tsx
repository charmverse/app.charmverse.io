import { Box, Typography, FormLabel } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';

type Props = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
};

export function RewardTemplateSelect({ value, onChange }: Props) {
  const { templates = [] } = useRewardTemplates();
  const options: SelectOptionType[] = templates.map((template) => ({
    id: template.page.id,
    name: template.page.title,
    color: 'default'
  }));
  // when we are ready to offer this option with a modal inside the page
  // options.push({
  //   id: 'add_new',
  //   name: '+ Add New',
  //   color: 'gray',
  //   variant: 'plain'
  // });
  return (
    <>
      <FormLabel>
        <Typography component='span' variant='subtitle1'>
          Require a template
        </Typography>
      </FormLabel>

      <Box display='flex' flex={1} flexDirection='column'>
        <SelectField
          includeSelectedOptions
          placeholder='Select'
          value={value || ''}
          options={options}
          onChange={async (templatePageId: string | string[]) => {
            if (templatePageId === 'add_new') {
              // TODO: show modal for new reward template
            } else if (typeof templatePageId === 'string') {
              onChange(templatePageId ?? null);
            }
          }}
        />
      </Box>
    </>
  );
}
