import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import type { PostCategory } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';

type Props = {
  category: PostCategory;
  onChange: (category: PostCategory) => void;
  onDelete: (category: PostCategory) => void;
};

export function ForumFilterCategory({ category, onChange, onDelete }: Props) {
  const [tempName, setTempName] = useState(category.name || '');

  useEffect(() => {
    setTempName(category.name || '');
  }, [category.name]);

  function onSave() {
    if (tempName !== category.name) {
      onChange({ ...category, name: tempName });
    }
  }

  const popupContent = useMemo(
    () => (
      <Stack>
        <MenuList>
          <Stack p={1}>
            <FieldLabel variant='subtitle2'>Category name</FieldLabel>
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
                onDelete(category);
              }}
            >
              <ListItemIcon>
                <DeleteOutlinedIcon fontSize='small' />
              </ListItemIcon>
              <Typography variant='subtitle1'>Delete</Typography>
            </MenuItem>
          )}
        </MenuList>
      </Stack>
    ),
    [category, tempName]
  );

  return (
    <PopperPopup popupContent={popupContent} onClose={onSave}>
      <IconButton size='small'>
        <MoreHorizIcon fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
