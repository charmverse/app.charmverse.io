import { Box, Typography } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import PostCategoryInput from './components/PostCategoriesInput';

interface PostPropertiesProps {
  pageId: string;
  postId: string;
  readOnly: boolean;
}

export default function PostProperties({ pageId, postId, readOnly }: PostPropertiesProps) {
  const currentSpace = useCurrentSpace();

  const { data: categories } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(currentSpace!.id)
  );

  return (
    <Box
      alignItems='center'
      flex={1}
      display='flex'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
    >
      <Box width='150px' marginRight='5px' color='text.secondary'>
        <Typography variant='caption' fontWeight='600'>
          Category
        </Typography>
      </Box>
      <PostCategoryInput options={categories ?? []} disabled={readOnly} onChange={() => undefined} />
    </Box>
  );
}
