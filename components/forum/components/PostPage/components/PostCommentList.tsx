import { Box, Stack, Typography } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { relativeTime } from 'lib/utilities/dates';
import type { PageContent } from 'models';

export function PostCommentList({ postId }: { postId: string }) {
  const { data: postComments } = useSWR(`${postId}/comments`, () => charmClient.forum.listPostComments(postId));

  if (!postComments) {
    return null;
  }

  return (
    <Stack>
      {postComments.map((postComment) => (
        <Stack key={postComment.id} gap={1}>
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Avatar avatar={postComment.user.avatar} />
            <Typography>{postComment.user.username}</Typography>
            <Typography variant='subtitle1'>{relativeTime(postComment.createdAt)}</Typography>
          </Stack>
          <Box ml={5}>
            <InlineCharmEditor focusOnInit={false} readOnly content={postComment.content as PageContent} />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
