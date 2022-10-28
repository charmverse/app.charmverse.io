import { Chip, MenuItem } from '@mui/material';
import type { HTMLAttributes } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionEdit } from 'components/common/form/fields/Select/SelectOptionEdit';

type Props = {
  option: SelectOptionType;
  menuItemProps?: HTMLAttributes<HTMLLIElement>;
  onChange?: (option: SelectOptionType) => void;
  onDelete?: (option: SelectOptionType) => void;
};

export function SelectOptionItem ({ option, onChange, onDelete, menuItemProps = {} }: Props) {
  const readOnly = !onChange && !onDelete;

  return (
    <MenuItem sx={{ display: 'flex', justifyContent: 'space-between' }} {...menuItemProps}>
      <Chip label={option.name} color={option.color} size='small' sx={{ px: 0.5 }} />
      {!readOnly && <SelectOptionEdit option={option} onChange={onChange} onDelete={onDelete} />}
    </MenuItem>
  );
}
