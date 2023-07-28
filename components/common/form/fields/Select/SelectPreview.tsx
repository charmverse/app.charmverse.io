import type { SxProps } from '@mui/material';
import { Chip, Stack, Typography } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

type Props = {
  value: string | string[];
  options?: SelectOptionType[] | null;
  name?: string;
  size?: 'small' | 'medium';
  emptyComponent?: React.ReactNode;
  wrapColumn?: boolean;
  sx?: SxProps;
};

export function SelectPreview({ sx, wrapColumn, value, options = [], name, size, emptyComponent }: Props) {
  const values: string[] = Array.isArray(value) ? value : [value].filter(Boolean);
  const valueOptions = values
    .map((v) => options?.find((o) => (o as SelectOptionType).id === v))
    .filter(Boolean) as SelectOptionType[];

  return (
    <Stack sx={sx} gap={name ? 0.5 : 0}>
      <Typography component='span' fontWeight='bold' variant={size === 'small' ? 'subtitle2' : 'body1'}>
        {name}
      </Typography>
      <Stack gap={0.5} flexDirection='row' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} overflow='hidden'>
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
          : emptyComponent}
      </Stack>
    </Stack>
  );
}
