import { Edit } from '@mui/icons-material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TaskIcon from '@mui/icons-material/Task';
import { IconButton, ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import type { PostCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useMemo, useState } from 'react';
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md';

import PopperPopup from 'components/common/PopperPopup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useForumCategoryNotification } from 'hooks/useUserSpaceNotifications';
import type { AvailablePostCategoryPermissionFlags } from 'lib/permissions/forum/interfaces';

import { EditCategoryDialog } from './EditCategoryDialog';
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

  const notifications = useForumCategoryNotification(category.id);

  const editDescriptionDialog = usePopupState({ variant: 'popover', popupId: 'add-roles-dialog' });

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
        <MenuItem
          sx={{
            py: 1
          }}
        >
          <Typography variant='subtitle1'>{category.name}</Typography>
        </MenuItem>
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
        <Tooltip title={!permissions.edit_category ? 'You do not have permissions to edit this category' : ''}>
          <MenuItem
            data-test={`open-category-description-dialog-${category.id}`}
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
          data-test={`open-category-permissions-dialog-${category.id}`}
          disabled={!permissions.manage_permissions}
          onClick={() => setPermissionsDialogIsOpen(true)}
          sx={{
            py: 1,
            justifyContent: 'flex-start'
          }}
        >
          <ListItemIcon>
            <LockIcon />
          </ListItemIcon>
          <Typography variant='subtitle1'>Manage permissions</Typography>
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
          </Tooltip>
        )}
      </MenuList>
    ),
    [category, tempName, space?.defaultPostCategoryId, notifications]
  );

  return (
    <>
      <PopperPopup popupContent={popupContent} onClose={onSave}>
        <IconButton data-test={`open-category-context-menu-${category.id}`} size='small'>
          <MoreHorizIcon fontSize='small' />
        </IconButton>
      </PopperPopup>
      <PostCategoryPermissionsDialog
        permissions={permissions}
        onClose={closeDialog}
        open={permissionsDialogIsOpen}
        postCategory={category}
      />
      <EditCategoryDialog
        onSave={(newValues) => onChange({ ...category, description: newValues.description, name: newValues.name })}
        category={category}
        onClose={editDescriptionDialog.close}
        open={editDescriptionDialog.isOpen}
      />
    </>
  );
}
