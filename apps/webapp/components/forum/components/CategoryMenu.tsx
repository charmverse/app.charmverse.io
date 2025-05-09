import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import startCase from 'lodash/startCase';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useForumCategories } from 'hooks/useForumCategories';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { postSortOptions } from '@packages/lib/forums/posts/constants';

import type { FilterProps } from './CategorySelect';
import { ForumFilterListLink } from './ForumFilterListLink';

export function CategoryMenu({ selectedCategoryId, selectedSort = 'new' }: FilterProps) {
  const { categories, error, createForumCategory } = useForumCategories();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const admin = useIsAdmin();
  const [newForumCategoryName, setNewForumCategoryName] = useState('');

  const currentCategory = categories.find((category) => category.id === selectedCategoryId);

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
          <ForumFilterListLink
            key={_sort}
            label={startCase(_sort.replace('_', ' '))}
            isSelected={_sort === selectedSort}
            value={_sort}
            href={`/forum${currentCategory ? `/${currentCategory.path}` : ''}?sort=${_sort}`}
          />
        ))}

        <Divider sx={{ my: 2 }} />
        <Stack mb={2}>
          <ForumFilterListLink label='All categories' isSelected={!selectedCategoryId} href='/forum' />
          {categories.map((category) => (
            <ForumFilterListLink
              key={category.id}
              href={`/forum/${category.path}`}
              label={category.name}
              value={category.id}
              isSelected={selectedCategoryId === category.id}
            />
          ))}
        </Stack>
        <Button
          data-test='add-category-button'
          sx={{
            ml: 2
          }}
          disabled={!admin}
          startIcon={<AddIcon />}
          onClick={addCategoryPopupState.open}
          variant='outlined'
          color='secondary'
          size='small'
          disabledTooltip="You don't have the permissions to add new forum categories"
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
          data-test='add-category-input'
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
          data-test='confirm-new-category-button'
          disabled={categories.find((category) => category.name === newForumCategoryName)}
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </Card>
  );
}
