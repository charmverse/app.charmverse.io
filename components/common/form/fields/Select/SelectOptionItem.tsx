import { Chip, MenuItem } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionEdit } from 'components/common/form/fields/Select/SelectOptionEdit';

type Props = {
  option: SelectOptionType;
  onChange: (option: SelectOptionType) => void;
  onDelete: (option: SelectOptionType) => void;
};

export function SelectOptionItem ({ option, onChange, onDelete }: Props) {
  return (
    <MenuItem sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Chip label={option.name} color={option.color} size='small' sx={{ px: 0.5 }} />
      <SelectOptionEdit option={option} onChange={onChange} onDelete={onDelete} />
    </MenuItem>
  );
}
