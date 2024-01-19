import CommentIcon from '@mui/icons-material/Comment';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/DocumentPage/components/CommentsFooter/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { CommentContent, CommentPermissions } from 'lib/comments';
import type { PageWithContent } from 'lib/pages';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Props = {
  page: PageWithContent;
  canCreateComments: boolean;
};

export function PageComments({ page, canCreateComments }: Props) {
  const { user } = useUser();
  const { lensProfile, setupLensProfile } = useLensProfile();
  const { space } = useCurrentSpace();
  const router = useRouter();
  const {
    nonNestedComments,
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
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { data: proposal } = useGetProposalDetails(isProposal ? page.id : null);
  const [createdComment, setCreatedComment] = useState<PageCommentWithVote | null>(null);
  const [publishCommentsToLens, setPublishCommentsToLens] = useState(!!user?.publishToLensDefault);
  const commentPermissions: CommentPermissions = {
    add_comment: canCreateComments ?? false,
    upvote: canCreateComments ?? false,
    downvote: canCreateComments ?? false,
    delete_comments: isAdmin
  };

  async function createComment(comment: CommentContent) {
    const _createdComment = await addComment(comment);
    setCreatedComment(_createdComment);
    if (isProposal && proposal?.lensPostLink && !isPublishingToLens && publishCommentsToLens) {
      const lensProfileSetup = await setupLensProfile();
      if (lensProfileSetup) {
        setIsPublishingToLens(true);
      }
    }
  }

  useEffect(() => {
    if (page.type === 'proposal' && proposal?.lensPostLink) {
      syncPageCommentsWithLensPost();
    }
  }, [page.id, proposal?.lensPostLink, page.type]);

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

      {canCreateComments && (
        <CommentForm
          isPublishingCommentsToLens={isPublishingToLens && !!createdComment?.parentId}
          publishToLens={publishCommentsToLens}
          setPublishToLens={setPublishCommentsToLens}
          showPublishToLens={
            Boolean(page.proposalId) &&
            page.type === 'proposal' &&
            Boolean(proposal?.lensPostLink) &&
            Boolean(lensProfile)
          }
          handleCreateComment={createComment}
        />
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
                  lensPostLink={proposal?.lensPostLink}
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

              {canCreateComments && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
    </>
  );
}
