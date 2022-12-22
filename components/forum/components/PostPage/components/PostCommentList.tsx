import { Box, Stack, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import type { PostCommentWithVote } from 'lib/forums/comments/interface';
import { relativeTime } from 'lib/utilities/dates';
import type { PageContent } from 'models';

export function PostCommentList({ postComments }: { postComments: PostCommentWithVote[] }) {
  return (
    <Stack gap={2}>
      {postComments.map((postComment) => (
        <Stack key={postComment.id}>
          <Stack flexDirection='row' gap={1} alignItems='center'>
            <Avatar size='small' avatar={postComment.user.avatar} />
            <Typography>{postComment.user.username}</Typography>
            <Typography variant='subtitle1'>{relativeTime(postComment.createdAt)}</Typography>
          </Stack>
          <Box ml={3}>
            <InlineCharmEditor
              style={{
                paddingTop: 0,
                paddingBottom: 0
              }}
              focusOnInit={false}
              readOnly
              content={postComment.content as PageContent}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
