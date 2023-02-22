import CommentIcon from '@mui/icons-material/Comment';
import { Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';

import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';

type Props = {
  pageId: string;
};

export function PageComments({ pageId }: Props) {
  const { comments, commentSort, setCommentSort, isLoadingComments } = usePageComments(pageId);

  return isLoadingComments ? (
    <Box height={100}>
      <LoadingComponent size={24} isLoading label='Fetching comments' />
    </Box>
  ) : (
    <>
      {comments.length > 0 && (
        <Stack gap={1}>
          <CommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
          {/* {comments.map((comment) => (
            <PostComment
              post={post}
              permissions={permissions}
              setPostComments={setPostComments}
              comment={comment}
              key={comment.id}
            />
          ))} */}
        </Stack>
      )}

      {comments.length === 0 && (
        <Stack gap={1} alignItems='center' my={1}>
          <CommentIcon color='secondary' fontSize='large' />
          <Typography color='secondary' variant='h6'>
            No Comments Yet
          </Typography>
          {/* TODO: permissions! */}
          <Typography color='secondary'>Be the first to share what you think!</Typography>
        </Stack>
      )}
    </>
  );
}
