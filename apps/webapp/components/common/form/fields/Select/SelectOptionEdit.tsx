import { useTheme } from '@emotion/react';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import { useEffect, useMemo, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { isReturnKey } from '@packages/lib/utils/react';
import type { BrandColor } from 'theme/colors';

import { ColorSelectMenu } from '../../ColorSelectMenu';

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
                if (isReturnKey(e)) {
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
          <ColorSelectMenu onChange={onColorChange} selectedColor={option.color as BrandColor} />
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
