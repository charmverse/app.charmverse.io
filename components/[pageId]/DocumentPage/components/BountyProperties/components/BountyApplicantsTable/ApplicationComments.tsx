import { FormLabel } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { Application } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import type { CreateCommentPayload, UpdateCommentPayload } from 'components/common/comments/interfaces';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import { emptyDocument } from 'lib/prosemirror/constants';

export function ApplicationComments({
  applicationId,
  status
}: {
  status: Application['status'];
  applicationId: string;
}) {
  const { user } = useUser();
  const {
    data: applicationComments = [],
    isLoading,
    mutate: refetchApplicationComments
  } = useSWR(`/application/${applicationId}/comments`, () =>
    charmClient.bounties.getApplicationComments(applicationId)
  );

  async function onSendClicked(comment: Omit<CreateCommentPayload, 'parentId'>) {
    const applicationComment = await charmClient.bounties.addApplicationComment(applicationId, {
      content: comment.content,
      contentText: comment.contentText
    });
    refetchApplicationComments(
      (_applicationComments) => (_applicationComments ? [..._applicationComments, applicationComment] : []),
      {
        revalidate: false
      }
    );
  }

  async function updateComment(pageCommentId: string, comment: UpdateCommentPayload) {
    const updatedComment = await charmClient.bounties.editApplicationComment(applicationId, pageCommentId, {
      content: comment.content,
      contentText: comment.contentText
    });

    refetchApplicationComments(
      (_applicationComments) =>
        _applicationComments
          ? _applicationComments.map((_applicationComment) =>
              _applicationComment.id === pageCommentId ? updatedComment : _applicationComment
            )
          : [],
      {
        revalidate: false
      }
    );
  }

  async function deleteComment(commentId: string) {
    await charmClient.bounties.deleteApplicationComment(applicationId, commentId);

    refetchApplicationComments(
      (_applicationComments) =>
        _applicationComments
          ? _applicationComments.filter((_applicationComment) => _applicationComment.id !== commentId)
          : [],
      {
        revalidate: false
      }
    );
  }

  return (
    <Stack>
      <Stack>
        {applicationComments.length !== 0 && <FormLabel sx={{ fontWeight: 'bold', my: 1 }}>Messages</FormLabel>}
        {isLoading ? (
          <Box height={100}>
            <LoadingComponent size={24} isLoading label='Fetching comments' />
          </Box>
        ) : (
          <>
            {applicationComments.map((comment) => (
              <Comment
                replyingDisabled
                inlineCharmEditor
                permissions={{
                  add_comment: true,
                  delete_comments: comment.createdBy === user?.id,
                  downvote: false,
                  upvote: false
                }}
                comment={{
                  ...comment,
                  upvoted: false,
                  upvotes: 0,
                  downvotes: 0,
                  children: []
                }}
                key={comment.id}
                handleCreateComment={onSendClicked}
                handleUpdateComment={(commentUpdatePayload) => updateComment(comment.id, commentUpdatePayload)}
                handleDeleteComment={deleteComment}
              />
            ))}
          </>
        )}
      </Stack>

      {status !== 'rejected' && (
        <Stack gap={1}>
          <FormLabel>
            <strong>Send a message</strong>
          </FormLabel>
          <CommentForm
            inlineCharmEditor
            handleCreateComment={onSendClicked}
            initialValue={
              user?.id
                ? {
                    doc: emptyDocument,
                    rawText: ''
                  }
                : undefined
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
