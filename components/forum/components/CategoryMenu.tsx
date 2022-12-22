import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import type { PostCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useState } from 'react';

import Button from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useForumCategories } from 'hooks/useForumCategories';
import isAdmin from 'hooks/useIsAdmin';

import { ForumFilterCategory } from './CategoryPopup';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ marginForIcons: false })}
`;

function ForumFilterListLink({ category, label }: { label: string; category?: PostCategory }) {
  const { deleteForumCategory, updateForumCategory, currentCategory } = useForumCategories();
  const router = useRouter();
  const admin = isAdmin();

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
        href={`/${router.query.domain}/forum${category ? `?categoryId=${category.id}` : ''}`}
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
          fontWeight={(category ? currentCategory?.id === category.id : !currentCategory?.id) ? 'bold' : 'initial'}
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

  function createCategory() {
    createForumCategory(forumCategoryName);
    setForumCategoryName('');
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
        {/** TODO - Enable sorting
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }} gap={2}>
          {sortList.map((sort) => (
            <Link
              key={sort}
              href={getLinkUrl(sort)}

              color='inherit'
            >
              {sort}
            </Link>
          ))}
        </Box>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <Stack gap={1} my={1}>
          {
            // <Link
            //   key={category.name}
            //   // sx={{ fontWeight: category.name === query.category ? 'bold' : 'initial' }}
            //   color='inherit'
            // >
            // </Link>
                <Divider sx={{ pt: '10px', mb: '10px' }} />
        */}
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
