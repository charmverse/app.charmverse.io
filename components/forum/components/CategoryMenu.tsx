import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { PostCategory } from '@prisma/client';
import startCase from 'lodash/startCase';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import isAdmin from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostSortOption } from 'lib/forums/posts/constants';
import { postSortOptions } from 'lib/forums/posts/constants';

import { ForumFilterCategory } from './CategoryPopup';
import type { FilterProps } from './CategorySelect';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ marginForIcons: false })}
`;

type ForumSortFilterLinkProps = {
  label: string;
  isSelected: boolean;
  // Could be a sort key, a post category ID, or null
  value?: string;
  handleSelect: (value?: string | PostSortOption) => void;
};

function ForumFilterListLink({ label, value, isSelected, handleSelect }: ForumSortFilterLinkProps) {
  const { deleteForumCategory, updateForumCategory, setDefaultPostCategory, categories } = useForumCategories();
  const { showMessage } = useSnackbar();
  const admin = isAdmin();

  const category = value ? categories.find((c) => c.id === value) : null;

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

      {admin && category && (
        <span className='icons'>
          <ForumFilterCategory
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
export function CategoryMenu({ handleCategory, handleSort, selectedCategoryId, selectedSort = 'new' }: FilterProps) {
  const { categories, error, createForumCategory } = useForumCategories();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const admin = isAdmin();

  const [newForumCategoryName, setNewForumCategoryName] = useState('');

  function createCategory() {
    createForumCategory(newForumCategoryName);
    setNewForumCategoryName('');
    addCategoryPopupState.close();
  }

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 0
        }}
      >
        {postSortOptions.map((_sort) => (
          <StyledBox key={_sort}>
            <ForumFilterListLink
              label={startCase(_sort.replace('_', ' '))}
              isSelected={_sort === selectedSort}
              value={_sort}
              handleSelect={handleSort as (value?: string | PostSortOption) => void}
            />
          </StyledBox>
        ))}

        <Divider sx={{ my: 2 }} />
        <Stack mb={2}>
          <ForumFilterListLink label='All categories' isSelected={!selectedCategoryId} handleSelect={handleCategory} />
          {categories.map((category) => (
            <StyledBox key={category.id}>
              <ForumFilterListLink
                label={category.name}
                value={category.id}
                isSelected={selectedCategoryId === category.id}
                handleSelect={handleCategory}
              />
            </StyledBox>
          ))}
        </Stack>
        <Button
          sx={{
            ml: 2
          }}
          disabled={!admin}
          startIcon={<AddIcon />}
          onClick={addCategoryPopupState.open}
          variant='outlined'
          color='secondary'
          size='small'
          disabledTooltip="You don't have permission to add category"
        >
          Add category
        </Button>
      </CardContent>
      <Modal
        open={addCategoryPopupState.isOpen}
        onClose={() => {
          addCategoryPopupState.close();
        }}
        title='Add forum category'
      >
        <TextField
          sx={{
            mb: 1
          }}
          autoFocus
          fullWidth
          value={newForumCategoryName}
          onChange={(e) => {
            setNewForumCategoryName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createCategory();
            }
          }}
        />
        <Button
          disabled={categories.find((category) => category.name === newForumCategoryName)}
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </Card>
  );
}
