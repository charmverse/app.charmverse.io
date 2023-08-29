import type { SxProps } from '@mui/material';
import { Chip, Stack, Tooltip, Typography } from '@mui/material';

import { EmptyPlaceholder } from 'components/common/BoardEditor/components/properties/EmptyPlaceholder';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

type Props = {
  value: string | string[];
  options?: SelectOptionType[] | null;
  name?: string;
  size?: 'small' | 'medium';
  showEmpty?: boolean;
  wrapColumn?: boolean;
  readOnly?: boolean;
  readOnlyMessage?: string;
  sx?: SxProps;
};

export function SelectPreview({
  sx,
  wrapColumn,
  value,
  options = [],
  name,
  size,
  readOnly,
  readOnlyMessage,
  showEmpty
}: Props) {
  const values: string[] = Array.isArray(value) ? value : [value].filter(Boolean);
  const valueOptions = values
    .map((v) => options?.find((o) => (o as SelectOptionType).id === v))
    .filter(Boolean) as SelectOptionType[];
  return (
    <Stack data-test='select-preview' sx={sx} gap={name ? 0.5 : 0}>
      {name && (
        <Typography component='span' fontWeight='bold' variant={size === 'small' ? 'subtitle2' : 'body1'}>
          {name}
        </Typography>
      )}
      <Tooltip title={readOnlyMessage ?? null}>
        <Stack
          display='inline-flex'
          width='min-content'
          gap={0.5}
          flexDirection='row'
          flexWrap={wrapColumn ? 'wrap' : 'nowrap'}
          overflow='hidden'
        >
          {valueOptions.length !== 0
            ? valueOptions.map((valueOption) => (
                <Chip
                  sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }}
                  label={valueOption.name}
                  color={valueOption.color}
                  key={valueOption.name}
                  size='small'
                />
              ))
            : showEmpty && <EmptyPlaceholder>Empty</EmptyPlaceholder>}
        </Stack>
      </Tooltip>
    </Stack>
  );
}
