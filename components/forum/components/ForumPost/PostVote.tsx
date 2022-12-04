import { useTheme } from '@emotion/react';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Dispatch, SetStateAction } from 'react';

import charmClient from 'charmClient';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';

export function PostVote({
  postId,
  downvotes,
  upvotes,
  upvoted,
  setPosts
}: {
  postId: string;
  upvoted?: boolean;
  upvotes: number;
  downvotes: number;
  setPosts: Dispatch<
    SetStateAction<PaginatedPostList<{
      user?: Member | undefined;
    }> | null>
  >;
}) {
  const theme = useTheme();

  async function votePost(_upvoted?: boolean) {
    const forumPostPageVote = await charmClient.forum.votePost({
      postId,
      upvoted: _upvoted
    });

    setPosts((postPages) => {
      return postPages
        ? {
            cursor: postPages.cursor,
            data: postPages.data.map((page) => {
              if (page.postId === postId) {
                return {
                  ...page,
                  post: {
                    ...page.post,
                    ...forumPostPageVote,
                    upvoted: _upvoted
                  }
                };
              }
              return page;
            }),
            hasNext: postPages.hasNext
          }
        : null;
    });
  }

  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <NorthIcon
        fontSize='small'
        sx={{
          fill: upvoted === true ? theme.palette.success.main : ''
        }}
        onClick={() => votePost(upvoted === undefined || upvoted === false ? true : undefined)}
      />
      <Typography>{upvotes - downvotes}</Typography>
      <SouthIcon
        fontSize='small'
        sx={{
          fill: upvoted === false ? theme.palette.error.main : ''
        }}
        onClick={() => votePost(upvoted === undefined || upvoted === true ? false : undefined)}
      />
    </Box>
  );
}
