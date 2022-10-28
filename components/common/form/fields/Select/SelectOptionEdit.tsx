import { useTheme } from '@emotion/react';
import DeleteIcon from '@mui/icons-material/Delete';
import { Divider, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';

import FieldLabel from 'components/common/form/FieldLabel';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';

type Props = {
  option: SelectOptionType;
  onChange: (option: SelectOptionType) => void;
  onDelete?: (option: SelectOptionType) => void;
};

export function SelectOptionEdit ({ option, onChange, onDelete }: Props) {
  const theme = useTheme();

  function onNameChange (value: string) {
    onChange({ ...option, name: value });
  }

  function onColorChange (value: BrandColor) {
    onChange({ ...option, color: value });
  }

  return (
    <Stack>
      <MenuList>
        <Stack p={1}>
          <FieldLabel variant='subtitle2'>Option name</FieldLabel>
          <TextField value={option.name} onChange={e => onNameChange(e.target.value)} autoFocus />
        </Stack>
        {!!onDelete && (
          <MenuItem onClick={() => onDelete(option)}>
            <ListItemIcon>
              <DeleteIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Delete</Typography>
          </MenuItem>
        )}
        <Divider />
        <Stack p={1} pb={0}>
          <FieldLabel variant='subtitle2'>Color</FieldLabel>
        </Stack>
        {brandColorNames.map(color => (
          <MenuItem sx={{ textTransform: 'capitalize', display: 'flex', gap: 1 }} onClick={() => onColorChange(color)}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '20%',
              backgroundColor: theme.palette[color].main
            }}
            />
            <Typography variant='subtitle1'>
              {color}
            </Typography>
          </MenuItem>
        ))}

      </MenuList>
    </Stack>
  );
}
