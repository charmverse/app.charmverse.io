import type { PagePermissionFlags } from '@charmverse/core/permissions';
import CommentIcon from '@mui/icons-material/Comment';
import { Divider, Typography, Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useLensPublication } from 'components/settings/account/hooks/useLensPublication';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { CommentContent, CommentPermissions } from 'lib/comments';
import type { PageWithContent } from 'lib/pages';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

type Props = {
  page: PageWithContent;
  permissions: PagePermissionFlags;
};

export function PageComments({ page, permissions }: Props) {
  const { user } = useUser();
  const { lensProfile } = useLensProfile();
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
    syncPageComments
  } = usePageComments(page.id);
  const isAdmin = useIsAdmin();
  const isProposal = page.type === 'proposal';
  const { createLensComment } = useLensPublication({
    proposalId: page.proposalId ?? '',
    proposalPath: page.path,
    proposalTitle: page.title
  });
  const [isPublishingComments, setPublishingComments] = useState(false);
  const { data: proposal } = useGetProposalDetails(isProposal ? page.id : null);

  const [publishCommentsToLens, setPublishCommentsToLens] = useState(!!user?.publishToLensDefault);

  const commentPermissions: CommentPermissions = {
    add_comment: permissions.comment ?? false,
    upvote: permissions.comment ?? false,
    downvote: permissions.comment ?? false,
    delete_comments: isAdmin
  };

  // For root level comments lensPostId is the post's id and for replies it is the parent comment's id
  async function createComment(comment: CommentContent, lensPostId?: string | null) {
    const createdComment = await addComment(comment);
    if (isProposal && proposal?.lensPostLink && lensPostId && !isPublishingComments) {
      setPublishingComments(true);
      await createLensComment({
        commentContent: comment.content as PageContent,
        commentId: createdComment.id,
        lensPostId
      });
      setPublishingComments(false);
    }
  }

  useEffect(() => {
    if (page.type === 'proposal' && proposal?.lensPostLink) {
      syncPageComments();
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

      {permissions.comment && (
        <CommentForm
          isPublishingComments={isPublishingComments}
          publishToLens={publishCommentsToLens}
          setPublishToLens={setPublishCommentsToLens}
          showPublishToLens={
            Boolean(page.proposalId) &&
            page.type === 'proposal' &&
            Boolean(proposal?.lensPostLink) &&
            Boolean(lensProfile)
          }
          lensPostLink={proposal?.lensPostLink}
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

              {permissions.comment && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
    </>
  );
}
