import { Chip, Stack, Typography } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

type Props = {
  value: string | string[];
  options?: SelectOptionType[] | null;
  name?: string;
  size?: 'small' | 'medium';
};

export function SelectPreview ({ value, options = [], name, size }: Props) {
  const values: string[] = (Array.isArray(value) ? value : [value].filter(Boolean));
  const valueOptions = values.map(v => options?.find(
    o => (o as SelectOptionType).id === v
  )).filter(Boolean) as SelectOptionType[];

  return (
    <Stack gap={0.5}>
      <Typography fontWeight='bold' variant={size === 'small' ? 'subtitle2' : 'body1'}>{name}</Typography>
      <Stack gap={1} flexDirection='row' flexWrap='wrap'>
        {values.length !== 0 ? valueOptions.map(
          valueOption => <Chip sx={{ px: 0.5 }} label={valueOption.name} color={valueOption.color} key={valueOption.name} size='small' />
        ) : 'N/A'}
      </Stack>
    </Stack>
  );
}
