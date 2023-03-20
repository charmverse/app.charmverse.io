import styled from '@emotion/styled';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { PostCategory } from '@prisma/client';
import { useRouter } from 'next/router';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostSortOption } from 'lib/forums/posts/constants';

import { usePostCategoryPermissions } from '../hooks/usePostCategoryPermissions';

import { CategoryContextMenu } from './CategoryContextMenu';

const StyledMenuItem = styled(MenuItem)`
  ${hoverIconsStyle({ marginForIcons: false })}

  min-height: 36px;

  &.Mui-focused,
  &.Mui-selected,
  &.Mui-selected.Mui-focused {
    background-color: ${({ theme }) => theme.palette.action.selected};
  }
`;
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

  function handleChange(updatedCategory: PostCategory) {
    updateForumCategory(updatedCategory)
      .then(() => {
        showMessage('Category updated');
      })
      .catch((err) => {
        showMessage(err?.message || 'An error occurred while updating the category');
      });
  }

  function deleteCategory() {
    if (category) {
      deleteForumCategory(category).catch((err) => {
        showMessage(err?.message || 'An error occurred while deleting the category');
      });
    }

    showMessage('Category deleted');
  }

  return (
    <StyledMenuItem
      dense
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      selected={isSelected}
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
            onChange={handleChange}
            onDelete={deleteCategory}
            onSetNewDefaultCategory={setDefaultPostCategory}
          />
        </span>
      )}
    </StyledMenuItem>
  );
}
