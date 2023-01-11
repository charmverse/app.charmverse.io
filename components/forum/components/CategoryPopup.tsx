import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import type { PostCategory, Space } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

type Props = {
  category: PostCategory;
  onChange: (category: PostCategory) => void;
  onDelete: (category: PostCategory) => void;
  onSetNewDefaultCategory: (category: PostCategory) => void;
};

export function ForumFilterCategory({ category, onChange, onDelete, onSetNewDefaultCategory }: Props) {
  const [tempName, setTempName] = useState(category.name || '');
  const space = useCurrentSpace();

  useEffect(() => {
    setTempName(category.name || '');
  }, [category.name]);

  function onSave() {
    if (tempName !== category.name) {
      onChange({ ...category, name: tempName });
    }
  }

  const isDefaultSpacePostCategory = space?.defaultPostCategoryId === category.id;

  const popupContent = useMemo(
    () => (
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
          <Tooltip title={isDefaultSpacePostCategory ? 'You cannot delete the default post category' : ''}>
            <div>
              <MenuItem
                disabled={isDefaultSpacePostCategory}
                onClick={() => {
                  onDelete(category);
                }}
                sx={{
                  py: 1
                }}
              >
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Delete</Typography>
              </MenuItem>
            </div>
          </Tooltip>
        )}
        {!isDefaultSpacePostCategory && (
          <MenuItem
            disabled={isDefaultSpacePostCategory}
            onClick={() => {
              onSetNewDefaultCategory(category);
            }}
            sx={{
              py: 1
            }}
          >
            <ListItemIcon>
              <DeleteOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Set as default</Typography>
          </MenuItem>
        )}
      </MenuList>
    ),
    [category, tempName, space?.defaultPostCategoryId]
  );

  return (
    <PopperPopup popupContent={popupContent} onClose={onSave}>
      <IconButton size='small'>
        <MoreHorizIcon fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
