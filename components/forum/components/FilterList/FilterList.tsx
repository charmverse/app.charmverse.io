import AddIcon from '@mui/icons-material/Add';
import { Box, Stack, TextField } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumFilters } from 'hooks/useForumFilters';

export default function FilterList() {
  const { getLinkUrl, categories, sortList, error, refetchForumCategories } = useForumFilters();
  const { query } = useRouter();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const [forumCategoryName, setForumCategoryName] = useState('');
  const currentSpace = useCurrentSpace();
  const router = useRouter();
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
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }}>
          {sortList.map((sort) => (
            <Link
              key={sort}
              href={getLinkUrl(sort)}
              sx={{ fontWeight: sort === query.sort ? 'bold' : 'initial' }}
              color='inherit'
            >
              {sort}
            </Link>
          ))}
        </Box>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <Stack gap={1} my={1}>
          {categories?.map((category) => (
            <SelectOptionItem
              option={category as SelectOptionType}
              key={category.name}
              onChange={updateForumCategory}
              onDelete={deleteForumCategory}
              onChipClick={() => {
                router.push(getLinkUrl(category.name));
              }}
            />
            // <Link
            //   key={category.name}
            //   // sx={{ fontWeight: category.name === query.category ? 'bold' : 'initial' }}
            //   color='inherit'
            // >
            // </Link>
          ))}
        </Stack>
        <Button startIcon={<AddIcon />} onClick={addCategoryPopupState.open} variant='outlined'>
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
