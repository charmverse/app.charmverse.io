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
            <Link
              key={category.name}
              href={getLinkUrl(category.name)}
              sx={{ fontWeight: category.name === query.category ? 'bold' : 'initial' }}
              color='inherit'
            >
              {category.name}
            </Link>
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
        <Button onClick={createForumCategory}>Add</Button>
      </Modal>
    </Card>
  );
}
