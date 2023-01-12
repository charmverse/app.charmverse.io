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
import { postSortOptions } from 'lib/forums/posts/constants';

import { ForumFilterCategory } from './CategoryPopup';
import type { FilterProps } from './CategorySelect';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ marginForIcons: false })}
`;

function ForumFilterListLink({ category, label, sort }: { label: string; category?: PostCategory; sort?: string }) {
  const { deleteForumCategory, updateForumCategory, setDefaultPostCategory } = useForumCategories();
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const selectedCategory = router.query.categoryId as string | undefined;
  const selectedSort = router.query.sort as string | undefined;
  const admin = isAdmin();
  const link =
    label === 'All categories'
      ? `/${router.query.domain}/forum`
      : category
      ? `/${router.query.domain}/forum/${category.name}`
      : sort
      ? `/${router.query.domain}/forum?sort=${sort}`
      : '';

  const selected = category ? category.id === selectedCategory : sort ? sort === selectedSort : false;

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
      <Link
        href={link}
        sx={{
          cursor: 'pointer',
          wordBreak: 'break-all',
          pr: 3.5,
          width: '100%'
        }}
      >
        <Typography
          sx={{
            color: 'text.primary'
          }}
          fontWeight={
            selected || (label === 'All categories' && !selectedCategory && !selectedSort) ? 'bold' : 'initial'
          }
        >
          {label}
        </Typography>
      </Link>
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
export function CategoryMenu({ handleCategory, handleSort, selectedCategory, sort }: FilterProps) {
  const { categories, error, createForumCategory } = useForumCategories();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const admin = isAdmin();

  const router = useRouter();
  const currentSpace = useCurrentSpace();

  const [newForumCategoryName, setNewForumCategoryName] = useState('');

  function createCategory() {
    createForumCategory(newForumCategoryName);
    setNewForumCategoryName('');
    addCategoryPopupState.close();
  }

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }
  useEffect(() => {
    if (selectedCategory && currentSpace) {
      charmClient.track.trackAction('main_feed_filtered', {
        categoryName: selectedCategory,
        spaceId: currentSpace.id
      });
    }
  }, [router.query.categoryName]);

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 0
        }}
      >
        <Stack gap={1} my={1}>
          {postSortOptions.map((_sort) => (
            <StyledBox key={_sort}>
              <ForumFilterListLink label={startCase(_sort.replace('_', ' '))} sort={_sort} />
            </StyledBox>
          ))}
        </Stack>

        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <Stack mb={2}>
          <ForumFilterListLink label='All categories' />
          {categories.map((category) => (
            <StyledBox key={category.id}>
              <ForumFilterListLink label={category.name} category={category} />
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
