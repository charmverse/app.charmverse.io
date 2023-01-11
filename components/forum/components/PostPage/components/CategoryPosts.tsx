import { Card, CardContent, MenuItem, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';

export function CategoryPosts({ categoryId, postId }: { postId: string; categoryId: string }) {
  const currentSpace = useCurrentSpace();
  const router = useRouter();
  const { categories } = useForumCategories();

  const category = categories.find((_category) => _category.id === categoryId);

  const { data: postsData, isLoading: isLoadingPosts } = useSWR(
    currentSpace ? `forums/${categoryId}/posts` : null,
    () =>
      charmClient.forum.listForumPosts({
        spaceId: currentSpace!.id,
        categoryId,
        count: 5,
        sort: 'newest'
      })
  );

  if (!postsData || isLoadingPosts || !category) {
    return null;
  }

  const totalPosts = postsData.data.filter((post) => post.id !== postId).length;

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 2
        }}
      >
        <Typography variant='h6'>{category.name}</Typography>
        <Stack gap={1} my={1}>
          {totalPosts === 0 ? (
            <Typography>No posts</Typography>
          ) : (
            postsData.data.map((post) =>
              post.id === postId ? null : (
                <MenuItem
                  key={post.id}
                  dense
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Link
                    href={`/${router.query.domain}/forum/post/${post.path}`}
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
                    >
                      {post.title}
                    </Typography>
                  </Link>
                </MenuItem>
              )
            )
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
