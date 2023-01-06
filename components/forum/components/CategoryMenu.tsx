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
import { postSortOptions } from 'lib/forums/posts/constants';

import { ForumFilterCategory } from './CategoryPopup';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ marginForIcons: false })}
`;

function ForumFilterListLink({ category, label, sort }: { label: string; category?: PostCategory; sort?: string }) {
  const { deleteForumCategory, updateForumCategory, setDefaultPostCategory } = useForumCategories();
  const router = useRouter();
  const selectedCategory = router.query.categoryId as string | undefined;
  const selectedSort = router.query.sort as string | undefined;
  const admin = isAdmin();
  const link =
    label === 'All categories'
      ? `/${router.query.domain}/forum`
      : category
      ? `/${router.query.domain}/forum?categoryId=${category.id}`
      : sort
      ? `/${router.query.domain}/forum?sort=${sort}`
      : '';

  const selected = category ? category.id === selectedCategory : sort ? sort === selectedSort : false;

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
            onDelete={deleteForumCategory}
            onSetNewDefaultCategory={setDefaultPostCategory}
          />
        </span>
      )}
    </MenuItem>
  );
}

export function CategoryMenu() {
  const { categories, error, createForumCategory } = useForumCategories();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const admin = isAdmin();
  const [forumCategoryName, setForumCategoryName] = useState('');
  const router = useRouter();
  const currentSpace = useCurrentSpace();

  function createCategory() {
    createForumCategory(forumCategoryName);
    setForumCategoryName('');
    addCategoryPopupState.close();
  }

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  useEffect(() => {
    const selectedCategory = categories.find((category) => category.id === router.query.categoryId);
    if (selectedCategory && currentSpace?.id) {
      charmClient.track.trackAction('main_feed_filtered', {
        categoryName: selectedCategory.name,
        spaceId: currentSpace.id
      });
    }
  }, [router.query.categoryId, currentSpace]);

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 0
        }}
      >
        <Stack gap={1} my={1}>
          {postSortOptions.map((sort) => (
            <StyledBox key={sort}>
              <ForumFilterListLink label={startCase(sort.replace('_', ' '))} sort={sort} />
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
          value={forumCategoryName}
          onChange={(e) => {
            setForumCategoryName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createCategory();
            }
          }}
        />
        <Button
          disabled={
            forumCategoryName.length === 0 || categories.find((category) => category.name === forumCategoryName)
          }
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </Card>
  );
}
