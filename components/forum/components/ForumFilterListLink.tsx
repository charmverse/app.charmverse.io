import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { PostCategory } from '@prisma/client';
import { useState } from 'react';

import { useForumCategories } from 'hooks/useForumCategories';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostSortOption } from 'lib/forums/posts/constants';

import { usePostCategoryPermissions } from '../hooks/usePostCategoryPermissions';

import { CategoryContextMenu } from './CategoryContextMenu';

type ForumSortFilterLinkProps = {
  label: string;
  isSelected: boolean;
  // Could be a sort key, a post category ID, or null
  value?: string;
  handleSelect: (value?: string | PostSortOption) => void;
};
export function ForumFilterListLink({ label, value, isSelected, handleSelect }: ForumSortFilterLinkProps) {
  const { deleteForumCategory, updateForumCategory, setDefaultPostCategory, categories } = useForumCategories();
  const { showMessage } = useSnackbar();

  const category = value ? categories.find((c) => c.id === value) : null;
  const { permissions } = usePostCategoryPermissions(category?.id as string);

  function deleteCategory() {
    if (category) {
      deleteForumCategory(category).catch((err) => {
        showMessage(err?.message || 'An error occurred while deleting the category');
      });
    }

    showMessage('Category deleted');
  }

  return (
    <MenuItem
      dense
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Typography
        data-test={
          category ? `forum-category-${category.id}` : label === 'All categories' ? 'forum-all-categories' : null
        }
        sx={{
          color: 'text.primary',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        fontWeight={isSelected ? 'bold' : 'initial'}
        onClick={() => handleSelect(value)}
      >
        {label}
      </Typography>

      {(permissions?.edit_category || permissions?.delete_category || permissions?.manage_permissions) && (
        <span className='icons'>
          <CategoryContextMenu
            permissions={permissions}
            category={category as PostCategory}
            onChange={updateForumCategory}
            onDelete={deleteCategory}
            onSetNewDefaultCategory={setDefaultPostCategory}
          />
        </span>
      )}
    </MenuItem>
  );
}
