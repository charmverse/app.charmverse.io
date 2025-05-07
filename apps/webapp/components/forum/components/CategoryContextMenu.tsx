import type { PostCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { PostCategory } from '@charmverse/core/prisma';
import { Edit } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TaskIcon from '@mui/icons-material/Task';
import { IconButton, ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md';

import PopperPopup from 'components/common/PopperPopup';
import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useForumCategoryNotification } from 'hooks/useUserSpaceNotifications';

import { EditCategoryDialog } from './EditCategoryDialog';
import { PostCategoryPermissionsDialog } from './PostCategoryPermissions/PostCategoryPermissionsContainer';

type Props = {
  categoryId: string;
  onDelete: (category: PostCategory) => void;
  permissions: PostCategoryPermissionFlags;
};

export function CategoryContextMenu({ categoryId, onDelete, permissions }: Props) {
  const { updateForumCategory, setDefaultPostCategory, categories } = useForumCategories();
  const category = categories.find((c) => c.id === categoryId);
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();

  function onChange(updatedCategory: PostCategory) {
    updateForumCategory(updatedCategory)
      .then(() => {
        showMessage('Category updated');
      })
      .catch((err) => {
        showMessage(err?.message || 'An error occurred while updating the category');
      });
  }

  const notifications = useForumCategoryNotification(categoryId);

  const editDescriptionDialog = usePopupState({ variant: 'popover', popupId: 'add-roles-dialog' });

  const [permissionsDialogIsOpen, setPermissionsDialogIsOpen] = useState(false);

  function closeDialog() {
    setPermissionsDialogIsOpen(false);
  }

  const isDefaultSpacePostCategory = space?.defaultPostCategoryId === categoryId;

  const popupContent = useMemo(
    () => (
      <MenuList>
        <MenuItem
          sx={{
            py: 1
          }}
        >
          <Typography variant='subtitle1'>{category?.name}</Typography>
        </MenuItem>
        {!isDefaultSpacePostCategory && (
          <MenuItem
            disabled={isDefaultSpacePostCategory || !isAdmin}
            onClick={() => {
              if (category) {
                setDefaultPostCategory(category);
              }
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
        <Tooltip title={!permissions.edit_category ? 'You do not have permissions to edit this category' : ''}>
          <MenuItem
            data-test={`open-category-description-dialog-${categoryId}`}
            disabled={!permissions.edit_category}
            onClick={editDescriptionDialog.open}
            sx={{
              py: 1
            }}
          >
            <ListItemIcon>
              <Edit fontSize='small' />
            </ListItemIcon>
            <Typography variant='subtitle1'>Edit category</Typography>
          </MenuItem>
        </Tooltip>
        <MenuItem
          data-test={`open-category-permissions-dialog-${categoryId}`}
          onClick={() => setPermissionsDialogIsOpen(true)}
          sx={{
            py: 1,
            justifyContent: 'flex-start'
          }}
        >
          <ListItemIcon>
            <LockIcon />
          </ListItemIcon>
          <Typography variant='subtitle1' gap={1} display='flex'>
            Permissions <UpgradeChip upgradeContext='forum_permissions' />
          </Typography>
        </MenuItem>
        <Tooltip title='Receive notifications when new posts are created in this category'>
          <MenuItem
            sx={{
              py: 1,
              justifyContent: 'flex-start'
            }}
            onClick={notifications.toggle}
          >
            <ListItemIcon>
              {notifications.enabled ? <MdOutlineNotificationsNone /> : <MdOutlineNotificationsOff />}
            </ListItemIcon>
            <Typography variant='subtitle1'>{notifications.enabled ? 'Disable' : 'Enable'} notifications</Typography>
          </MenuItem>
        </Tooltip>

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
            <MenuItem
              disabled={isDefaultSpacePostCategory || !permissions.delete_category}
              onClick={() => {
                if (category) onDelete(category);
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
          </Tooltip>
        )}
      </MenuList>
    ),
    [category, space?.defaultPostCategoryId, notifications]
  );

  return (
    <>
      <PopperPopup popupContent={popupContent} onClose={editDescriptionDialog.close}>
        <IconButton
          data-test={`open-category-context-menu-${categoryId}`}
          size='small'
          onClick={(e) => {
            // prevents triggering the href of the parent link
            e.preventDefault();
          }}
        >
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>

      {category && (
        <PostCategoryPermissionsDialog category={category} onClose={closeDialog} open={permissionsDialogIsOpen} />
      )}

      {category && editDescriptionDialog.isOpen && (
        <EditCategoryDialog
          onSave={(newValues) => onChange({ ...category, description: newValues.description, name: newValues.name })}
          category={category}
          onClose={editDescriptionDialog.close}
        />
      )}
    </>
  );
}
