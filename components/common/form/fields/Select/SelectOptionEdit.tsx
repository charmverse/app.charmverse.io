import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, ListItemIcon, MenuList, Stack, TextField, Typography, IconButton, MenuItem } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import PopperPopup from 'components/common/PopperPopup';
import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';

type Props = {
  option: SelectOptionType;
  onChange?: (option: SelectOptionType) => void;
  onDelete?: (option: SelectOptionType) => void;
  onToggleOptionEdit?: (isOpened: boolean) => void;
};

export function SelectOptionEdit({ option, onChange, onDelete, onToggleOptionEdit }: Props) {
  const theme = useTheme();
  const [tempName, setTempName] = useState(option.name || '');

  useEffect(() => {
    setTempName(option.name || '');
  }, [option.name]);

  function onSave() {
    onToggleOptionEdit?.(false);

    if (tempName !== option.name) {
      onChange?.({ ...option, name: tempName });
      setTempName(option.name || '');
    }
  }

  function onColorChange(value: BrandColor) {
    onChange?.({ ...option, color: value });
  }

  const popupContent = useMemo(
    () => (
      <Stack>
        <MenuList>
          <Stack p={1}>
            <FieldLabel variant='subtitle2'>Option name</FieldLabel>
            <TextField
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.code === 'Enter') {
                  onSave();
                }
              }}
            />
          </Stack>
          {!!onDelete && (
            <MenuItem
              onClick={() => {
                onDelete(option);
                onToggleOptionEdit?.(false);
              }}
            >
              <ListItemIcon>
                <DeleteOutlinedIcon fontSize='small' />
              </ListItemIcon>
              <Typography variant='subtitle1'>Delete</Typography>
            </MenuItem>
          )}
          <Divider />
          <Stack p={1} pb={0}>
            <FieldLabel variant='subtitle2'>Color</FieldLabel>
          </Stack>
          {brandColorNames.map((color) => (
            <MenuItem
              key={color}
              sx={{ textTransform: 'capitalize', display: 'flex', gap: 1, justifyContent: 'space-between' }}
              onClick={(e) => {
                e.stopPropagation();
                onColorChange(color);
              }}
            >
              <Stack flexDirection='row' gap={1} alignContent='center'>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '20%',
                    backgroundColor: theme.palette[color].main
                  }}
                />
                <Typography variant='subtitle1'>{color}</Typography>
              </Stack>

              {color === option.color && <CheckIcon fontSize='small' />}
            </MenuItem>
          ))}
        </MenuList>
      </Stack>
    ),
    [option, onColorChange, tempName]
  );

  return (
    <PopperPopup popupContent={popupContent} onClose={onSave} onOpen={() => onToggleOptionEdit?.(true)}>
      <IconButton size='small'>
        <MoreHorizIcon fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
