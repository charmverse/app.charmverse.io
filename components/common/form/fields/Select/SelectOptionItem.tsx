import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Chip, IconButton, MenuItem } from '@mui/material';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionEdit } from 'components/common/form/fields/Select/SelectOptionEdit';
import PopperPopup from 'components/common/PopperPopup';

type Props = {
  option: SelectOptionType;
  onChange: (option: SelectOptionType) => void;
  onDelete: (option: SelectOptionType) => void;
};

export function SelectOptionItem ({ option, onChange, onDelete }: Props) {
  return (
    <MenuItem sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Chip label={option.name} color={option.color} size='small' />

      <PopperPopup
        popupContent={
          <SelectOptionEdit option={option} onChange={onChange} onDelete={onDelete} />
      }
      >
        <IconButton size='small'>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>
    </MenuItem>
  );
}
