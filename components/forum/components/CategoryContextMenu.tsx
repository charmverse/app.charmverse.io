import { Edit } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TaskIcon from '@mui/icons-material/Task';
import { IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import type { PostCategory, Space } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import type { AvailablePostCategoryPermissionFlags } from 'lib/permissions/forum/interfaces';

import { PostCategoryPermissionsDialog } from './permissions/PostCategoryPermissions';

type Props = {
  category: PostCategory;
  onChange: (category: PostCategory) => void;
  onDelete: (category: PostCategory) => void;
  onSetNewDefaultCategory: (category: PostCategory) => void;
  permissions: AvailablePostCategoryPermissionFlags;
};

export function CategoryContextMenu({ category, onChange, onDelete, onSetNewDefaultCategory, permissions }: Props) {
  const [tempName, setTempName] = useState(category.name || '');
  const space = useCurrentSpace();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    setTempName(category.name || '');
  }, [category.name]);

  function onSave() {
    if (tempName !== category.name) {
      onChange({ ...category, name: tempName });
    }
  }

  const [permissionsDialogIsOpen, setPermissionsDialogIsOpen] = useState(false);

  function closeDialog() {
    setPermissionsDialogIsOpen(false);
  }

  const isDefaultSpacePostCategory = space?.defaultPostCategoryId === category.id;

  const popupContent = useMemo(
    () => (
      <MenuList>
        <Stack p={1}>
          <FieldLabel variant='subtitle2'>Category name</FieldLabel>
          <TextField
            disabled={!permissions.edit_category}
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
        {!isDefaultSpacePostCategory && (
          <MenuItem
            disabled={isDefaultSpacePostCategory || !isAdmin}
            onClick={() => {
              onSetNewDefaultCategory(category);
            }}
            sx={{
              py: 1
            }}
          >
            <ListItemIcon>
              <TaskIcon fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Set as default</Typography>
          </MenuItem>
        )}
        {!!onDelete && (
          <Tooltip
            title={
              !permissions.delete_category
                ? 'You do not have permissions to delete this category'
                : isDefaultSpacePostCategory
                ? 'You cannot delete the default post category'
                : ''
            }
          >
            <div>
              <MenuItem
                disabled={isDefaultSpacePostCategory || !permissions.delete_category}
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
        <Tooltip title={!permissions.manage_permissions ? 'Only forum administrators can manage permisions' : ''}>
          <div>
            <MenuItem
              disabled={!permissions.manage_permissions}
              onClick={() => setPermissionsDialogIsOpen(true)}
              sx={{
                py: 1
              }}
            >
              <ListItemIcon>
                <Edit fontSize='small' />
              </ListItemIcon>
              <Typography variant='subtitle1'>Manage permissions</Typography>
            </MenuItem>
          </div>
        </Tooltip>
      </MenuList>
    ),
    [category, tempName, space?.defaultPostCategoryId]
  );

  return (
    <>
      <PopperPopup popupContent={popupContent} onClose={onSave}>
        <IconButton size='small'>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>
      <PostCategoryPermissionsDialog onClose={closeDialog} open={permissionsDialogIsOpen} postCategory={category} />
    </>
  );
}
