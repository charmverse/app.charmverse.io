import type { PagePermissionFlags } from '@charmverse/core/permissions';
import CommentIcon from '@mui/icons-material/Comment';
import { Divider, Typography, Box, Stack } from '@mui/material';
import { useState } from 'react';

import { useGetProposalDetails } from 'charmClient/hooks/proposals';
import { usePageComments } from 'components/[pageId]/Comments/usePageComments';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import { CommentSort } from 'components/common/comments/CommentSort';
import LoadingComponent from 'components/common/LoadingComponent';
import { useLensPublication } from 'components/settings/account/hooks/useLensPublication';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { CommentContent, CommentPermissions } from 'lib/comments';
import type { PageWithContent } from 'lib/pages';
import type { PageContent } from 'lib/prosemirror/interfaces';

type Props = {
  page: PageWithContent;
  permissions: PagePermissionFlags;
};

export function PageComments({ page, permissions }: Props) {
  const { user } = useUser();
  const {
    comments,
    commentSort,
    setCommentSort,
    isLoadingComments,
    addComment,
    updateComment,
    deleteComment,
    voteComment
  } = usePageComments(page.id);
  const isAdmin = useIsAdmin();
  const isProposal = page.type === 'proposal';
  const { createLensComment } = useLensPublication({
    proposalId: page.proposalId ?? '',
    proposalPath: page.path,
    proposalTitle: page.title
  });
  const { data: proposal } = useGetProposalDetails(isProposal ? page.id : null);

  const [publishCommentsToLens, setPublishCommentsToLens] = useState(!!user?.publishToLensDefault);

  const commentPermissions: CommentPermissions = {
    add_comment: permissions.comment ?? false,
    upvote: permissions.comment ?? false,
    downvote: permissions.comment ?? false,
    delete_comments: isAdmin
  };

  async function createComment(comment: CommentContent) {
    const createdComment = await addComment(comment);
    if (isProposal && proposal?.lensPostLink && publishCommentsToLens) {
      await createLensComment({
        commentContent: comment.content as PageContent,
        commentId: createdComment.id,
        proposal: page,
        lensPostId: proposal.lensPostLink
      });
    }
  }

  const hideComments = isProposal && (!proposal || proposal.status === 'draft');

  if (hideComments) return null;

  return (
    <>
      <Divider sx={{ my: 3 }} />

      {permissions.comment && (
        <CommentForm
          publishToLens={publishCommentsToLens}
          setPublishToLens={setPublishCommentsToLens}
          showPublishToLens={!!page.proposalId && page.type === 'proposal' && !!proposal?.lensPostLink}
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
              <CommentSort commentSort={commentSort} setCommentSort={setCommentSort} />
              {comments.map((comment) => (
                <Comment
                  permissions={commentPermissions}
                  comment={comment}
                  key={comment.id}
                  handleCreateComment={createComment}
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

              {permissions.comment && <Typography color='secondary'>Be the first to share what you think!</Typography>}
            </Stack>
          )}
        </>
      )}
    </>
  );
}
