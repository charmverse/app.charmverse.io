import CommentIcon from '@mui/icons-material/Comment';
import { Divider, FormLabel, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { Application } from '@prisma/client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Comment } from 'components/common/comments/Comment';
import type { CreateCommentPayload, UpdateCommentPayload } from 'components/common/comments/interfaces';
import LoadingComponent from 'components/common/LoadingComponent';
import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { getContentWithMention } from 'lib/pages/getContentWithMention';
import { emptyDocument } from 'lib/prosemirror/constants';

import { ApplicationCommentForm } from './ApplicationCommentForm';

export function ApplicationComments({
  createdBy,
  applicationId,
  status,
  context
}: {
  createdBy: string;
  status: Application['status'];
  applicationId: string;
  context: 'applicant' | 'reviewer';
}) {
  const { members } = useMembers();
  const { user } = useUser();
  const [editorKey, setEditorKey] = useState(0); // a key to allow us to reset charmeditor contents
  const {
    data: applicationComments = [],
    isLoading,
    mutate: refetchApplicationComments
  } = useSWR(`/application/${applicationId}/comments`, () =>
    charmClient.bounties.getApplicationComments(applicationId)
  );
  const member = members.find((c) => c.id === createdBy);
  const { showMemberProfile } = useMemberProfile();

  function resetInput() {
    setEditorKey((key) => key + 1);
  }

  useEffect(() => {
    resetInput();
  }, [user, member]);

  async function onSendClicked(comment: Omit<CreateCommentPayload, 'parentId'>) {
    resetInput();
    const applicationComment = await charmClient.bounties.addApplicationComment(applicationId, {
      content: comment.content,
      contentText: comment.contentText
    });
    refetchApplicationComments(
      (_applicationComments) => (_applicationComments ? [applicationComment, ..._applicationComments] : []),
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
      <Stack gap={2}>
        <FormLabel sx={{ fontWeight: 'bold' }}>Comments</FormLabel>
        {isLoading ? (
          <Box height={100}>
            <LoadingComponent size={24} isLoading label='Fetching comments' />
          </Box>
        ) : (
          <>
            {applicationComments.map((comment) => (
              <Comment
                replyingDisabled
                permissions={{ add_comment: true, delete_comments: true, downvote: false, upvote: false }}
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

            {applicationComments.length === 0 && (
              <Stack gap={1} alignItems='center' my={1}>
                <CommentIcon color='secondary' fontSize='large' />
                <Typography color='secondary' variant='h6'>
                  No Comments Yet
                </Typography>

                <Typography color='secondary'>Be the first to share what you think!</Typography>
              </Stack>
            )}
          </>
        )}
      </Stack>

      {status !== 'rejected' && (
        <>
          <Divider
            style={{
              marginBottom: 24,
              marginTop: 24
            }}
          />
          <FormLabel>
            <strong>Send a message (optional)</strong>
          </FormLabel>
          <ApplicationCommentForm
            key={editorKey}
            initialValue={
              user?.id
                ? {
                    doc:
                      context === 'reviewer'
                        ? getContentWithMention({ myUserId: user.id, targetUserId: createdBy })
                        : emptyDocument,
                    rawText: ''
                  }
                : null
            }
            username={user?.username}
            avatar={user?.avatar}
            onSubmit={(createCommentPayload) =>
              onSendClicked({ content: createCommentPayload.doc, contentText: createCommentPayload.rawText })
            }
          />
        </>
      )}
    </Stack>
  );
}
