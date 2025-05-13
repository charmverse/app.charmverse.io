import type { SxProps } from '@mui/material';
import { Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';

import { EmptyPlaceholder } from 'components/common/DatabaseEditor/components/properties/EmptyPlaceholder';

type Props = {
  value: string | string[];
  options?: SelectOptionType[] | null;
  name?: string;
  size?: 'small' | 'medium';
  showEmpty?: boolean;
  wrapColumn?: boolean;
  readOnly?: boolean;
  readOnlyMessage?: string;
  emptyMessage?: string;
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
  showEmpty,
  emptyMessage
}: Props) {
  const values: string[] = Array.isArray(value) ? value : [value].filter(Boolean);
  const valueOptions = values
    .map((v) => options?.find((o) => (o as SelectOptionType).id === v))
    .filter(Boolean) as SelectOptionType[];

  return (
    <Stack data-test='select-preview' sx={sx} gap={name ? 0.5 : 0}>
      {name && (
        <Typography
          data-test='select-preview-name'
          component='span'
          fontWeight='bold'
          variant={size === 'small' ? 'subtitle2' : 'body1'}
        >
          {name}
        </Typography>
      )}
      <Tooltip title={readOnly ? readOnlyMessage : null}>
        <Stack
          display='inline-flex'
          width='fit-content'
          gap={0.5}
          flexDirection='row'
          flexWrap={wrapColumn ? 'wrap' : 'nowrap'}
          overflow='hidden'
        >
          {valueOptions.length !== 0
            ? valueOptions.map((valueOption) => (
                <Chip
                  data-test={`select-preview-value-${valueOption.id}`}
                  sx={{ px: 0.5, cursor: readOnly ? 'text' : 'pointer' }}
                  label={valueOption.name}
                  color={valueOption.color}
                  key={valueOption.name}
                  size='small'
                />
              ))
            : showEmpty && <EmptyPlaceholder>{emptyMessage ?? 'Empty'}</EmptyPlaceholder>}
        </Stack>
      </Tooltip>
    </Stack>
  );
}
