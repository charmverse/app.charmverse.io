import { Box, Typography } from '@mui/material';
import type { PostCategory } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import PostCategoryInput from './components/PostCategoriesInput';

interface PostPropertiesProps {
  postId: string;
  readOnly: boolean;
}

export default function PostProperties({ postId, readOnly }: PostPropertiesProps) {
  const currentSpace = useCurrentSpace();
  const { data: post, mutate } = useSWR(`post/${postId}`, () => charmClient.forum.getForumPost(postId));

  const { data: categories } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(currentSpace!.id)
  );

  const postCategory = categories?.find((category) => category.id === post?.categoryId);

  async function updateForumPost(_postCategory: PostCategory | null) {
    await charmClient.forum.updateForumPost(postId, {
      categoryId: _postCategory?.id
    });
    mutate((_post) => (_post ? { ..._post, categoryId: _postCategory?.id ?? null } : undefined), {
      revalidate: false
    });
  }

  return (
    <Box
      alignItems='center'
      flex={1}
      display='flex'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        },
        my: 2
      }}
    >
      <Box width='150px' marginRight='5px' color='text.secondary'>
        <Typography variant='caption' fontWeight='600'>
          Category
        </Typography>
      </Box>
      <PostCategoryInput
        value={postCategory ?? null}
        options={categories ?? []}
        disabled={readOnly}
        onChange={updateForumPost}
      />
    </Box>
  );
}
