import { Chip, Stack, Typography } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

type Props = {
  value: string | string[];
  options?: SelectOptionType[] | null;
  name?: string;
  size?: 'small' | 'medium';
  emptyComponent?: React.ReactNode;
};

export function SelectPreview({ value, options = [], name, size, emptyComponent }: Props) {
  const values: string[] = Array.isArray(value) ? value : [value].filter(Boolean);
  const valueOptions = values
    .map((v) => options?.find((o) => (o as SelectOptionType).id === v))
    .filter(Boolean) as SelectOptionType[];

  return (
    <Stack gap={name ? 0.5 : 0}>
      <Typography fontWeight='bold' variant={size === 'small' ? 'subtitle2' : 'body1'}>
        {name}
      </Typography>
      <Stack gap={0.5} flexDirection='row' flexWrap='wrap'>
        {valueOptions.length !== 0
          ? valueOptions.map((valueOption) => (
              <Chip
                sx={{ px: 0.5 }}
                label={valueOption.name}
                color={valueOption.color}
                key={valueOption.name}
                size='small'
              />
            ))
          : emptyComponent || 'N/A'}
      </Stack>
    </Stack>
  );
}
