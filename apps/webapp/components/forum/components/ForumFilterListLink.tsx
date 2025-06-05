import { styled } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { useForumCategories } from 'hooks/useForumCategories';
import { useSnackbar } from 'hooks/useSnackbar';

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
` as typeof MenuItem;

type ForumSortFilterLinkProps = {
  label: string;
  isSelected: boolean;
  // Could be a sort key, a post category ID, or null
  value?: string;
  href: string;
};
export function ForumFilterListLink({ label, value, isSelected, href }: ForumSortFilterLinkProps) {
  const { deleteForumCategory, categories } = useForumCategories();
  const { showMessage } = useSnackbar();

  const category = value ? categories.find((c) => c.id === value) : null;
  const { permissions } = usePostCategoryPermissions(category?.id as string);
  function deleteCategory() {
    if (value) {
      deleteForumCategory({ id: value })
        .then(() => {
          showMessage('Category deleted');
        })
        .catch((err) => {
          showMessage(err?.message || 'An error occurred while deleting the category');
        });
    }
  }

  return (
    <StyledMenuItem
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      selected={isSelected}
      component={Link}
      href={href}
    >
      <Typography
        data-test={value ? `forum-category-${value}` : label === 'All categories' ? 'forum-all-categories' : null}
        sx={{
          color: 'text.primary',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        fontWeight={isSelected ? 'bold' : 'initial'}
      >
        {label}
      </Typography>

      {value && (permissions?.edit_category || permissions?.delete_category || permissions?.manage_permissions) && (
        <span
          className='icons'
          onClick={(e) => {
            // prevents triggering the href of the parent link
            e.stopPropagation();
          }}
        >
          <CategoryContextMenu permissions={permissions} categoryId={value} onDelete={deleteCategory} />
        </span>
      )}
    </StyledMenuItem>
  );
}
