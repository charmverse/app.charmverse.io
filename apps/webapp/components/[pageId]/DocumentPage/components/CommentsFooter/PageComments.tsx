import CommentIcon from '@mui/icons-material/Comment';
import { Box, Divider, Card, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/DocumentPage/components/CommentsFooter/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { LoginButton } from 'components/login/components/LoginButton';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { CommentContent, CommentPermissions } from '@packages/lib/comments';
import type { PageWithContent } from 'lib/pages';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { setUrlWithoutRerender } from '@packages/lib/utils/browser';

type Props = {
  page: PageWithContent;
  canComment: boolean;
};

export function PageComments({ page, canComment }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const {
    comments,
    commentSort,
    setCommentSort,
    isLoadingComments,
    addComment,
    updateComment,
    deleteComment,
    voteComment,
    syncPageCommentsWithLensPost
  } = usePageComments(page.id);
  const isAdmin = useIsAdmin();
  const isProposal = page.type === 'proposal';
  const { data: proposal } = useGetProposalDetails(isProposal ? page.id : null);
  const [, setCreatedComment] = useState<PageCommentWithVote | null>(null);
  const commentPermissions: CommentPermissions = {
    add_comment: canComment ?? false,
    upvote: canComment ?? false,
    downvote: canComment ?? false,
    delete_comments: isAdmin
  };

  async function createComment(comment: CommentContent) {
    const _createdComment = await addComment(comment);
    setCreatedComment(_createdComment);
  }

  useEffect(() => {
    if (page.type === 'proposal' && page?.lensPostLink) {
      syncPageCommentsWithLensPost();
    }
  }, [page.id, page?.lensPostLink, page.type]);

  useEffect(() => {
    const commentId = router.query.commentId;
    if (commentId && typeof window !== 'undefined' && !isLoadingComments && comments.length) {
      setTimeout(() => {
        const commentDomElement = window.document.getElementById(`comment-${commentId}`);
        if (commentDomElement) {
          requestAnimationFrame(() => {
            commentDomElement.scrollIntoView({
              behavior: 'smooth'
            });
            setUrlWithoutRerender(router.pathname, { commentId: null });
          });
        }
      }, 250);
    }
  }, [router.query.commentId, isLoadingComments]);

  const hideComments = isProposal && (!proposal || proposal.status === 'draft');

  if (hideComments) return null;

  return (
    <>
      <Divider sx={{ my: 3 }} />

      {canComment && <CommentForm handleCreateComment={createComment} />}
      {!user && (
        <Card variant='outlined' sx={{ mb: 2 }}>
          <Box p={2} display='flex' justifyContent='center' width='100%'>
            <LoginButton signInLabel='Sign in to comment' />
          </Box>
        </Card>
      )}

      {isLoadingComments ? (
        <Box height={100}>
          <LoadingComponent size={24} isLoading label='Fetching comments' />
        </Box>
      ) : (
        <>
          {comments.length > 0 && (
            <Stack gap={1}>
              {/** Card comments don't have upvote capabilities */}
              {isProposal && <CommentSort commentSort={commentSort} setCommentSort={setCommentSort} />}
              {comments.map((comment) => (
                <Comment
                  permissions={commentPermissions}
                  comment={comment}
                  key={comment.id}
                  handleCreateComment={createComment}
                  handleUpdateComment={updateComment}
                  handleDeleteComment={deleteComment}
                  handleVoteComment={isProposal ? voteComment : undefined}
                  lensPostLink={page?.lensPostLink}
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

              {canComment && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
    </>
  );
}
