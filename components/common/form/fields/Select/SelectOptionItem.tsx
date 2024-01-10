import { Box, Chip, MenuItem, Stack } from '@mui/material';
import type { HTMLAttributes } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionEdit } from 'components/common/form/fields/Select/SelectOptionEdit';

type Props = {
  option: SelectOptionType;
  menuItemProps?: HTMLAttributes<HTMLLIElement>;
  onChange?: (option: SelectOptionType) => void;
  onDelete?: (option: SelectOptionType) => void;
  onToggleOptionEdit?: (isOpened: boolean) => void;
};

export function SelectOptionItem({ option, onChange, onDelete, onToggleOptionEdit, menuItemProps = {} }: Props) {
  const readOnly = !onChange && !onDelete;
  return (
    <MenuItem
      {...menuItemProps}
      sx={{ display: 'flex' }}
      disabled={option.disabled}
      data-test={`select-option-${option.id}`}
    >
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' flex={1} maxWidth='100%'>
        <Chip
          label={option.dropdownName || option.name}
          color={option.color}
          size='small'
          sx={{
            cursor: 'pointer',
            // 100% - 24px to not collide with ellipsis
            maxWidth: readOnly ? '100%' : 'calc(100% - 24px)',
            px: 0.5,
            zIndex: 0,
            position: 'relative'
          }}
        />

        {!readOnly && (
          <Box position='absolute' right='5px'>
            <SelectOptionEdit
              option={option}
              onChange={onChange}
              onDelete={onDelete}
              onToggleOptionEdit={onToggleOptionEdit}
            />
          </Box>
        )}
      </Stack>
    </MenuItem>
  );
}
