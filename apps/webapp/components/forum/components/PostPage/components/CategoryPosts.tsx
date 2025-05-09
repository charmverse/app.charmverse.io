import SpeakerNotesOffOutlinedIcon from '@mui/icons-material/SpeakerNotesOffOutlined';
import { Card, CardContent, Divider, MenuItem, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import type { ListForumPostsRequest } from '@packages/lib/forums/posts/listForumPosts';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

import { usePostDialog } from '../../PostDialog/hooks/usePostDialog';

export function CategoryPosts({ categoryId, postId }: { postId: string; categoryId: string }) {
  const { space: currentSpace } = useCurrentSpace();
  const { categories } = useForumCategories();
  const category = categories.find((_category) => _category.id === categoryId);
  const [sort, setSort] = useState<ListForumPostsRequest['sort']>('new');
  const { showPost } = usePostDialog();
  const router = useRouter();

  const { data: postsData, isLoading: isLoadingPosts } = useSWR(
    currentSpace ? `forums/${categoryId}/posts?sort=${sort}` : null,
    () =>
      charmClient.forum.listForumPosts({
        spaceId: currentSpace!.id,
        categoryId,
        count: 5,
        sort
      })
  );

  if (isLoadingPosts) {
    return (
      <Card variant='outlined'>
        <CardContent>
          <LoadingComponent size={20} label='Fetching related posts' />
        </CardContent>
      </Card>
    );
  }

  const totalPosts = postsData?.data.filter((post) => post.id !== postId).length;

  if (totalPosts === 0 || !postsData || !category) {
    return (
      <Card variant='outlined'>
        <CardContent>
          <Stack justifyContent='center' alignItems='center' gap={1} my={2}>
            <SpeakerNotesOffOutlinedIcon color='secondary' fontSize='large' />
            <Typography color='secondary'>No related posts</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 0
        }}
      >
        <Typography variant='h6' mb={2} textAlign='center'>
          {category.name}
        </Typography>
        {totalPosts !== 0 && (
          <Stack mb={1}>
            <MenuItem
              onClick={() => {
                setSort('new');
              }}
            >
              <Typography
                sx={{
                  color: 'text.primary',
                  fontWeight: sort === 'new' ? 'bold' : 'initial'
                }}
              >
                Newest Posts
              </Typography>
            </MenuItem>
          </Stack>
        )}
        <Divider />
        <Stack my={1}>
          {postsData.data.map((post) =>
            post.id === postId ? null : (
              <MenuItem
                key={post.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography
                  sx={{
                    color: 'text.primary',
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    pr: 3.5,
                    width: '100%'
                  }}
                  onClick={() => {
                    showPost({
                      postId: post.id,
                      onClose() {
                        setUrlWithoutRerender(router.pathname, { pageId: null });
                      }
                    });
                    setUrlWithoutRerender(router.pathname, { pageId: post.id });
                  }}
                >
                  {post.title}
                </Typography>
              </MenuItem>
            )
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
