import { Stack, Typography } from '@mui/material';
import type { PostCategory } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
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

  const postStatus = post?.status;

  const postCategory = categories?.find((category) => category.id === post?.categoryId);

  async function updateForumPost(_postCategory: PostCategory | null) {
    await charmClient.forum.updateForumPost(postId, {
      categoryId: _postCategory?.id
    });
    mutate((_post) => (_post ? { ..._post, categoryId: _postCategory?.id ?? null } : undefined), {
      revalidate: false
    });
  }

  async function publishForumPost() {
    await charmClient.forum.publishForumPost(postId);
    mutate((_post) => (_post ? { ..._post, status: 'published' } : undefined), {
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
      {postStatus !== 'published' && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          onClick={publishForumPost}
        >
          Publish Post
        </Button>
      )}
    </Stack>
  );
}
