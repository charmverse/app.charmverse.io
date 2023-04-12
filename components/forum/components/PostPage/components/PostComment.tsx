import type { Post } from '@prisma/client';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { Comment } from 'components/common/comments/Comment';
import type { UpdateCommentPayload, CreateCommentPayload } from 'components/common/comments/interfaces';
import { getUpdatedCommentVote } from 'components/common/comments/utils';
import type { PostCommentWithVote, PostCommentWithVoteAndChildren } from 'lib/forums/comments/interface';
import type { AvailablePostPermissionFlags } from 'lib/permissions/forum/interfaces';

type Props = {
  comment: PostCommentWithVoteAndChildren;
  setPostComments: KeyedMutator<PostCommentWithVote[] | undefined>;
  permissions?: AvailablePostPermissionFlags;
  post: Post | null;
};

export function PostComment({ post, comment, setPostComments, permissions }: Props) {
  async function addComment({ content, contentText, parentId }: CreateCommentPayload) {
    const postComment = await charmClient.forum.createPostComment(comment.postId, {
      content,
      contentText,
      parentId
    });

    setPostComments((comments) => (comments ? [postComment, ...comments] : []));
  }

  async function updateComment({ id, content, contentText }: UpdateCommentPayload) {
    const updatedComment = await charmClient.forum.updatePostComment({
      commentId: id,
      content,
      contentText,
      postId: comment.postId
    });

    setPostComments((comments) =>
      comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, ...updatedComment } : _comment))
    );
  }

  async function voteComment({ upvoted, commentId }: { upvoted: boolean | null; commentId: string }) {
    await charmClient.forum.upOrDownVoteComment({
      postId: comment.postId,
      commentId,
      upvoted
    });

    const postCommentVote = getUpdatedCommentVote(comment, upvoted);

    setPostComments((comments) =>
      comments?.map((_comment) =>
        _comment.id === comment.id
          ? {
              ...comment,
              ...postCommentVote
            }
          : _comment
      )
    );
  }

  async function deleteComment(commentId: string) {
    await charmClient.forum.deletePostComment({ commentId, postId: comment.postId });
    setPostComments((comments) =>
      comments?.map((_comment) => (_comment.id === comment.id ? { ..._comment, deletedAt: new Date() } : _comment))
    );
  }

  return (
    <Comment
      permissions={permissions}
      comment={comment}
      key={comment.id}
      handleCreateComment={addComment}
      handleUpdateComment={updateComment}
      handleDeleteComment={deleteComment}
      handleVoteComment={voteComment}
      deletingDisabled={!!post?.proposalId}
    />
  );
}
