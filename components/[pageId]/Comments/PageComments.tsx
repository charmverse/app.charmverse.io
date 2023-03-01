import CommentIcon from '@mui/icons-material/Comment';
import { Divider, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';

import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { usePagePermissions } from 'hooks/usePagePermissions';
import type { CommentPermissions } from 'lib/comments';

type Props = {
  pageId: string;
};

export function PageComments({ pageId }: Props) {
  const {
    comments,
    commentSort,
    setCommentSort,
    isLoadingComments,
    addComment,
    updateComment,
    deleteComment,
    voteComment
  } = usePageComments(pageId);

  const { permissions } = usePagePermissions({
    pageIdOrPath: pageId
  });

  const commentPermissions: CommentPermissions = {
    add_comment: permissions?.comment ?? false,
    upvote: permissions?.comment ?? false,
    downvote: permissions?.comment ?? false,
    delete_comments: false
  };

  return (
    <>
      <Divider sx={{ my: 3 }} />

      {permissions?.comment && <CommentForm handleCreateComment={addComment} />}

      {isLoadingComments ? (
        <Box height={100}>
          <LoadingComponent size={24} isLoading label='Fetching comments' />
        </Box>
      ) : (
        <>
          {comments.length > 0 && (
            <Stack gap={1}>
              <CommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
              {comments.map((comment) => (
                <Comment
                  permissions={commentPermissions}
                  comment={comment}
                  key={comment.id}
                  handleCreateComment={addComment}
                  handleUpdateComment={updateComment}
                  handleDeleteComment={deleteComment}
                  handleVoteComment={voteComment}
                />
              ))}
            </Stack>
          )}

          {comments.length === 0 && (
            <Stack gap={1} alignItems='center' my={1}>
              <CommentIcon color='secondary' fontSize='large' />
              <Typography color='secondary' variant='h6'>
                No Comments Yet
              </Typography>

              {permissions?.comment && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
    </>
  );
}
