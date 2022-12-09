import { Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { PostCategory } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

import PostCategoryInput from './components/PostCategoriesInput';

interface PostPropertiesProps {
  postId: string;
  readOnly: boolean;
}

export default function PostProperties({ postId, readOnly }: PostPropertiesProps) {
  const currentSpace = useCurrentSpace();
  const {
    data: pagePost,
    mutate,
    isValidating
  } = useSWR(`post/${postId}`, () => charmClient.forum.getForumPost(postId));
  const { data: categories } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(currentSpace!.id)
  );

  const { user } = useUser();

  const postStatus = pagePost?.post.status;

  const postCategory = categories?.find((category) => category.id === pagePost?.post.categoryId);

  async function updateForumPost(_postCategory: PostCategory | null) {
    await charmClient.forum.updateForumPost(postId, {
      categoryId: _postCategory?.id
    });
    mutate((page) => (page ? { ...page, post: { ...page?.post, categoryId: _postCategory?.id ?? null } } : undefined), {
      revalidate: false
    });
  }

  async function publishForumPost() {
    await charmClient.forum.publishForumPost(postId);
    mutate((page) => (page ? { ...page, post: { ...page.post, status: 'published' } } : undefined), {
      revalidate: false
    });
  }

  return (
    <Stack
      gap={1}
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        },
        my: 2
      }}
    >
      <Box display='flex' flexDirection='row' justifyContent='space-between' mb={2}>
        <Typography fontWeight='bold'>Post information</Typography>
        <Button
          sx={{
            width: 'fit-content'
          }}
          size='small'
          disabledTooltip={
            postStatus === 'published'
              ? 'Post has already been published'
              : `You don't have permission to publish this post`
          }
          onClick={publishForumPost}
          disabled={postStatus === 'published' || isValidating || pagePost?.createdBy !== user?.id}
        >
          {postStatus === 'published' ? 'Published' : 'Publish Post'}
        </Button>
      </Box>

      <Stack alignItems='center' gap={2} flexDirection='row' color='text.secondary'>
        <Typography variant='caption' fontWeight='600'>
          Category
        </Typography>
        <PostCategoryInput
          value={postCategory ?? null}
          options={categories ?? []}
          disabled={readOnly}
          onChange={updateForumPost}
        />
      </Stack>
    </Stack>
  );
}
