import type { PagePermissionFlags } from '@charmverse/core/permissions';
import CommentIcon from '@mui/icons-material/Comment';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { CommentContent, CommentPermissions } from 'lib/comments';
import type { PageWithContent } from 'lib/pages';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { CreateLensPublication } from '../DocumentPage/components/CreateLensPublication';

type Props = {
  page: PageWithContent;
  permissions: PagePermissionFlags;
};

export function PageComments({ page, permissions }: Props) {
  const { user } = useUser();
  const { lensProfile, setupLensProfile } = useLensProfile();
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
    syncPageComments
  } = usePageComments(page.id);
  const isAdmin = useIsAdmin();
  const isProposal = page.type === 'proposal';
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);
  const { data: proposal } = useGetProposalDetails(isProposal ? page.id : null);
  const [createdComment, setCreatedComment] = useState<PageCommentWithVote | null>(null);
  const [publishCommentsToLens, setPublishCommentsToLens] = useState(!!user?.publishToLensDefault);
  const commentPermissions: CommentPermissions = {
    add_comment: permissions.comment ?? false,
    upvote: permissions.comment ?? false,
    downvote: permissions.comment ?? false,
    delete_comments: isAdmin
  };

  async function createComment(comment: CommentContent) {
    const _createdComment = await addComment(comment);
    setCreatedComment(_createdComment);
    if (isProposal && proposal?.lensPostLink && !isPublishingToLens) {
      const lensProfileSetup = await setupLensProfile();
      if (lensProfileSetup) {
        setIsPublishingToLens(true);
      }
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
  const lensParentPublicationId =
    createdComment?.parentId === null
      ? proposal?.lensPostLink
      : nonNestedComments.find((comment) => comment.id === createdComment?.parentId)?.lensCommentLink;

  if (hideComments) return null;

  return (
    <>
      <Divider sx={{ my: 3 }} />

      {permissions.comment && (
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

              {permissions.comment && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
      {isPublishingToLens && createdComment && proposal?.lensPostLink && page.proposalId && lensParentPublicationId && (
        <CreateLensPublication
          publicationType='comment'
          commentId={createdComment.id}
          content={createdComment.content as PageContent}
          parentPublicationId={lensParentPublicationId}
          onSuccess={async () => {
            await syncPageComments();
            setIsPublishingToLens(false);
            setCreatedComment(null);
          }}
          onError={() => {
            setIsPublishingToLens(false);
            setCreatedComment(null);
          }}
          proposalId={page.proposalId}
          proposalPath={page.path}
          proposalTitle={page.title}
        />
      )}
    </>
  );
}
