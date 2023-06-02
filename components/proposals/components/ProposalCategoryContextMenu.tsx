import type { ProposalCategoryWithPermissions } from '@charmverse/core';
import { Edit } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton, ListItemIcon, MenuItem, MenuList, Stack, TextField, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useProposalCategories } from '../hooks/useProposalCategories';

import { ProposalCategoryPermissionsDialog } from './permissions/ProposalCategoryPermissions';

type Props = {
  category: ProposalCategoryWithPermissions;
};

export function ProposalCategoryContextMenu({ category }: Props) {
  const [tempName, setTempName] = useState(category.title || '');
  const space = useCurrentSpace();
  const { mutateCategory, deleteCategory } = useProposalCategories();
  const { showMessage } = useSnackbar();

  const { permissions } = category;

  useEffect(() => {
    setTempName(category.title || '');
  }, [category.title]);

  function onSave() {
    if (tempName !== category.title && space) {
      charmClient.proposals.updateProposalCategory(space.id, { ...category, title: tempName }).then(mutateCategory);
    }
  }

  function onDelete() {
    if (space) {
      deleteCategory(category.id).catch((err) => {
        showMessage(err.message ?? 'Something went wrong', 'warning');
      });
    }
  }

  const [permissionsDialogIsOpen, setPermissionsDialogIsOpen] = useState(false);

  function closeDialog() {
    setPermissionsDialogIsOpen(false);
  }

  const popupContent = useMemo(
    () => (
      <MenuList>
        <Stack p={1}>
          <FieldLabel variant='subtitle2'>Category name</FieldLabel>
          <TextField
            disabled={!permissions.edit}
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
          <Tooltip title={!permissions.delete ? 'You do not have permissions to delete this category' : ''}>
            <div>
              <MenuItem
                disabled={!permissions.delete}
                onClick={onDelete}
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
        <Tooltip title={!permissions.manage_permissions ? 'Only space admins can manage permisions' : ''}>
          <div>
            <MenuItem
              data-test={`open-category-permissions-dialog-${category.id}`}
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
    [category, tempName]
  );

  return (
    <>
      <PopperPopup popupContent={popupContent} onClose={onSave}>
        <IconButton data-test={`open-category-context-menu-${category.id}`} size='small'>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>
      <ProposalCategoryPermissionsDialog
        permissions={permissions}
        onClose={closeDialog}
        open={permissionsDialogIsOpen}
        proposalCategory={category}
      />
    </>
  );
}
