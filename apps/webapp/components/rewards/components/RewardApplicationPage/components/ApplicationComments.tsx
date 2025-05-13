import type { ApplicationComment } from '@charmverse/core/prisma';
import { Box, FormLabel, Stack } from '@mui/material';
import { emptyDocument } from '@packages/charmeditor/constants';
import type { CommentWithChildren } from '@packages/lib/comments';
import { useMemo } from 'react';

import charmClient from 'charmClient';
import { useGetApplicationComments } from 'charmClient/hooks/rewards';
import { Comment } from 'components/common/comments/Comment';
import { CommentForm } from 'components/common/comments/CommentForm';
import type { CreateCommentPayload, UpdateCommentPayload } from 'components/common/comments/interfaces';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';

export function ApplicationComments({ applicationId }: { applicationId: string }) {
  const { user } = useUser();
  const {
    data: applicationComments = [],
    mutate: refetchApplicationComments,
    isLoading
  } = useGetApplicationComments({
    applicationId
  });

  async function onSendClicked(comment: CreateCommentPayload) {
    const applicationComment = await charmClient.rewards.addApplicationComment({
      applicationId,
      payload: {
        content: comment.content,
        contentText: comment.contentText,
        parentCommentId: comment.parentId
      }
    });
    refetchApplicationComments(
      (_applicationComments) => (_applicationComments ? [..._applicationComments, applicationComment] : []),
      {
        revalidate: false
      }
    );
  }

  async function updateComment(commentId: string, comment: UpdateCommentPayload) {
    const updatedComment = await charmClient.rewards.editApplicationComment({
      commentId,
      payload: {
        content: comment.content,
        contentText: comment.contentText
      }
    });

    refetchApplicationComments(
      (_applicationComments) =>
        _applicationComments
          ? _applicationComments.map((_applicationComment) =>
              _applicationComment.id === commentId ? updatedComment : _applicationComment
            )
          : [],
      {
        revalidate: false
      }
    );
  }

  async function deleteComment(commentId: string) {
    const softDeletedComment = await charmClient.rewards.deleteApplicationComment({ applicationId, commentId });

    refetchApplicationComments(
      (_applicationComments) =>
        _applicationComments
          ? _applicationComments.map((_applicationComment) =>
              _applicationComment.id === commentId ? softDeletedComment : _applicationComment
            )
          : [],
      {
        revalidate: false
      }
    );
  }

  /**
   * Application comments use the reward (ex. reward) page id for the page
   * The root parent id is the application ID
   */
  function buildCommentTree(comments: ApplicationComment[]) {
    const rootComments: ApplicationComment[] = [];
    const map: Record<string, ApplicationComment[]> = {};
    comments.forEach((comment) => {
      if (comment.parentId) {
        if (!map[comment.parentId]) {
          map[comment.parentId] = [];
        }
        map[comment.parentId].push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    function buildSubTree(_parentId: string): CommentWithChildren[] {
      return (map[_parentId] || []).map((comment) => ({
        ...comment,
        children: buildSubTree(comment.id)
      }));
    }

    return rootComments.map((comment) => ({ ...comment, children: buildSubTree(comment.id) }));
  }

  const commentTree = useMemo(() => {
    return buildCommentTree(applicationComments);
  }, [applicationComments]);

  return (
    <Stack>
      <Stack>
        {applicationComments.length !== 0 && <FormLabel sx={{ fontWeight: 'bold', my: 1 }}>Discussion</FormLabel>}
        {isLoading ? (
          <Box height={100}>
            <LoadingComponent size={24} isLoading label='Fetching comments' />
          </Box>
        ) : (
          <>
            {commentTree.map((comment) => (
              <Comment
                deletingDisabled={false}
                inlineCharmEditor
                permissions={{
                  add_comment: true,
                  delete_comments: comment.createdBy === user?.id,
                  downvote: false,
                  upvote: false
                }}
                comment={comment}
                key={comment.id}
                handleCreateComment={onSendClicked}
                handleUpdateComment={(commentUpdatePayload) => updateComment(comment.id, commentUpdatePayload)}
                handleDeleteComment={deleteComment}
              />
            ))}
          </>
        )}
      </Stack>

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
    </Stack>
  );
}
