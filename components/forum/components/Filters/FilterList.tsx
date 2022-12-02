import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Box, Stack, TextField, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionEdit } from 'components/common/form/fields/Select/SelectOptionEdit';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumFilters } from 'hooks/useForumFilters';
import isAdmin from 'hooks/useIsAdmin';

import type { FilterProps } from './FilterSelect';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ absolutePositioning: true, marginForIcons: false })}
`;

export default function FilterList({ categoryIdSelected, selectedCategory }: FilterProps) {
  const { getLinkUrl, categories, sortList, error, refetchForumCategories } = useForumFilters();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const [forumCategoryName, setForumCategoryName] = useState('');
  const currentSpace = useCurrentSpace();
  const admin = isAdmin();
  async function createForumCategory() {
    if (currentSpace) {
      await charmClient.forum.createPostCategory(currentSpace.id, {
        name: forumCategoryName,
        spaceId: currentSpace.id
      });
      refetchForumCategories();
      setForumCategoryName('');
      addCategoryPopupState.close();
    }
  }

  async function updateForumCategory(option: SelectOptionType) {
    if (currentSpace) {
      await charmClient.forum.updatePostCategory({
        spaceId: currentSpace.id,
        id: option.id,
        color: option.color,
        name: option.name
      });
      refetchForumCategories();
    }
  }

  async function deleteForumCategory(option: SelectOptionType) {
    if (currentSpace) {
      await charmClient.forum.deletePostCategory({ id: option.id, spaceId: currentSpace.id });
      refetchForumCategories();
    }
  }

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  if (!currentSpace) {
    return null;
  }

  return (
    <Card variant='outlined'>
      <CardContent>
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
        <Stack gap={2} my={2}>
          <Typography
            key='all-categories'
            onClick={() => categoryIdSelected(undefined)}
            sx={{ fontWeight: selectedCategory === undefined ? 'bold' : 'initial' }}
            color='inherit'
          >
            All categories
          </Typography>
          {categories?.map((category) => (
            <StyledBox
              key={category.id}
              display='flex'
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography
                onClick={() => categoryIdSelected(category.id)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: selectedCategory === category.id ? 'bold' : 'initial'
                }}
              >
                {category.name}
              </Typography>
              {!admin && (
                <Box className='icons'>
                  <SelectOptionEdit
                    option={category as SelectOptionType}
                    onChange={updateForumCategory}
                    onDelete={deleteForumCategory}
                  />
                </Box>
              )}
            </StyledBox>
          ))}
        </Stack>
        <Button disabled={!admin} startIcon={<AddIcon />} onClick={addCategoryPopupState.open} variant='outlined'>
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
          fullWidth
          value={forumCategoryName}
          onChange={(e) => {
            setForumCategoryName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createForumCategory();
            }
          }}
        />
        <Button
          disabled={
            forumCategoryName.length === 0 || categories?.find((category) => category.name === forumCategoryName)
          }
          onClick={createForumCategory}
        >
          Add
        </Button>
      </Modal>
    </Card>
  );
}
